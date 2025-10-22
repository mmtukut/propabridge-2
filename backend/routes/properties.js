const express = require('express');
const router = express.Router();
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const { query } = require('../config/db');
const Property = require('../models/Property');
const matchingService = require('../services/matchingService');
const { requireAdmin } = require('../middleware/adminAuth');

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Configure multer for memory storage
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  }
});

/**
 * GET /api/v1/properties/search
 * Search properties with filters
 */
router.get('/search', async (req, res) => {
  try {
    const {
      location,
      maxPrice,
      minPrice,
      bedrooms,
      propertyType,
      limit = 20
    } = req.query;

    const criteria = {};
    if (location) criteria.location = location;
    if (maxPrice) criteria.maxPrice = parseFloat(maxPrice);
    if (minPrice) criteria.minPrice = parseFloat(minPrice);
    if (bedrooms) criteria.bedrooms = parseInt(bedrooms);
    if (propertyType) criteria.propertyType = propertyType;
    criteria.limit = parseInt(limit);

    // Use matching service for smart results
    const properties = await matchingService.findMatches(criteria);

    res.status(200).json({
      success: true,
      count: properties.length,
      properties
    });
  } catch (error) {
    console.error('Error searching properties:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to search properties',
      error: error.message
    });
  }
});

/**
 * GET /api/v1/properties/:id
 * Get single property by ID
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const property = await Property.findById(id);

    if (!property) {
      return res.status(404).json({
        success: false,
        message: 'Property not found'
      });
    }

    res.status(200).json({
      success: true,
      property
    });
  } catch (error) {
    console.error('Error fetching property:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch property',
      error: error.message
    });
  }
});

/**
 * POST /api/v1/properties
 * Create new property (requires authentication)
 */
router.post('/', async (req, res) => {
  try {
    // TODO: Add authentication middleware
    const {
      type,
      location,
      price,
      bedrooms,
      bathrooms,
      area,
      features,
      amenities,
      owner_id
    } = req.body;

    // Validate required fields
    if (!type || !location || !price || !bedrooms) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: type, location, price, bedrooms'
      });
    }

    const propertyData = {
      type,
      location,
      price: parseFloat(price),
      bedrooms: parseInt(bedrooms),
      bathrooms: bathrooms ? parseInt(bathrooms) : bedrooms,
      area: area ? parseFloat(area) : null,
      features,
      amenities,
      verified: false,
      status: 'pending',
      ownerId: owner_id || 'temp_owner'
    };

    const property = await Property.create(propertyData);

    res.status(201).json({
      success: true,
      message: 'Property created successfully',
      property
    });
  } catch (error) {
    console.error('Error creating property:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create property',
      error: error.message
    });
  }
});

/**
 * PUT /api/v1/properties/:id
 * Update property (requires authentication)
 */
router.put('/:id', async (req, res) => {
  try {
    // TODO: Add authentication middleware and check ownership
    const { id } = req.params;
    const updates = req.body;

    const property = await Property.update(id, updates);

    if (!property) {
      return res.status(404).json({
        success: false,
        message: 'Property not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Property updated successfully',
      property
    });
  } catch (error) {
    console.error('Error updating property:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update property',
      error: error.message
    });
  }
});

/**
 * DELETE /api/v1/properties/:id
 * Delete property (requires authentication)
 */
router.delete('/:id', async (req, res) => {
  try {
    // TODO: Add authentication middleware and check ownership
    const { id } = req.params;
    const property = await Property.delete(id);

    if (!property) {
      return res.status(404).json({
        success: false,
        message: 'Property not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Property deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting property:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete property',
      error: error.message
    });
  }
});

/**
 * POST /api/v1/properties/:id/view
 * Track property view
 */
router.post('/:id/view', async (req, res) => {
  try {
    const { id } = req.params;
    const { phone, userId } = req.body;

    // Save view to property_views table
    await query(
      `INSERT INTO property_views (property_id, user_id, phone, viewed_at) 
       VALUES ($1, $2, $3, NOW())`,
      [id, userId || null, phone || null]
    );
    
    res.status(200).json({
      success: true,
      message: 'View tracked successfully'
    });
  } catch (error) {
    console.error('Error tracking view:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to track view',
      error: error.message
    });
  }
});

/**
 * POST /api/v1/properties/images
 * Upload property images (requires authentication)
 */
router.post('/images', upload.array('images', 10), async (req, res) => {
  try {
    const { propertyId, isPrimary } = req.body;
    
    if (!propertyId) {
      return res.status(400).json({
        success: false,
        message: 'Property ID is required'
      });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No images provided'
      });
    }

    const uploadedImages = [];
    
    // Upload each image to Cloudinary
    for (let i = 0; i < req.files.length; i++) {
      const file = req.files[i];
      
      try {
        const result = await new Promise((resolve, reject) => {
          cloudinary.uploader.upload_stream(
            {
              folder: 'propabridge/properties',
              public_id: `property_${propertyId}_${Date.now()}_${i}`,
              transformation: [
                { width: 800, height: 600, crop: 'fill', quality: 'auto' }
              ]
            },
            (error, result) => {
              if (error) reject(error);
              else resolve(result);
            }
          ).end(file.buffer);
        });

        // Save image URL to database
        const isPrimaryImage = isPrimary === 'true' || (isPrimary === undefined && i === 0);
        
        const dbResult = await query(
          `INSERT INTO property_images (property_id, image_url, is_primary) 
           VALUES ($1, $2, $3) 
           RETURNING *`,
          [propertyId, result.secure_url, isPrimaryImage]
        );

        uploadedImages.push(dbResult.rows[0]);
        
      } catch (uploadError) {
        console.error(`Error uploading image ${i}:`, uploadError);
        // Continue with other images even if one fails
      }
    }

    if (uploadedImages.length === 0) {
      return res.status(500).json({
        success: false,
        message: 'Failed to upload any images'
      });
    }

    res.status(200).json({
      success: true,
      message: `Successfully uploaded ${uploadedImages.length} image(s)`,
      images: uploadedImages
    });
    
  } catch (error) {
    console.error('Error uploading images:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to upload images',
      error: error.message
    });
  }
});

/**
 * GET /api/v1/properties/admin/pending
 * Get all pending properties for admin approval (requires admin authentication)
 */
router.get('/admin/pending', requireAdmin, async (req, res) => {
  try {
    const result = await query(
      `SELECT p.*, u.name as owner_name, u.phone as owner_phone,
              COUNT(pi.id) as image_count
       FROM properties p
       LEFT JOIN users u ON p.user_id = u.id
       LEFT JOIN property_images pi ON p.id = pi.property_id
       WHERE p.verified = false AND p.status = 'pending'
       GROUP BY p.id, u.name, u.phone
       ORDER BY p.created_at DESC`
    );

    res.status(200).json({
      success: true,
      count: result.rows.length,
      properties: result.rows
    });
  } catch (error) {
    console.error('Error fetching pending properties:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch pending properties',
      error: error.message
    });
  }
});

/**
 * PUT /api/v1/properties/:id/approve
 * Approve a property (requires admin authentication)
 */
router.put('/:id/approve', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { adminNotes } = req.body;

    const property = await Property.update(id, {
      verified: true,
      status: 'active',
      verified_at: new Date(),
      verified_by: req.adminUser.phone, // Use authenticated admin's phone
      admin_notes: adminNotes
    });

    if (!property) {
      return res.status(404).json({
        success: false,
        message: 'Property not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Property approved successfully',
      property
    });
  } catch (error) {
    console.error('Error approving property:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to approve property',
      error: error.message
    });
  }
});

/**
 * PUT /api/v1/properties/:id/reject
 * Reject a property (requires admin authentication)
 */
router.put('/:id/reject', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const property = await Property.update(id, {
      status: 'rejected',
      rejected_at: new Date(),
      rejected_by: req.adminUser.phone, // Use authenticated admin's phone
      rejection_reason: reason
    });

    if (!property) {
      return res.status(404).json({
        success: false,
        message: 'Property not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Property rejected',
      property
    });
  } catch (error) {
    console.error('Error rejecting property:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reject property',
      error: error.message
    });
  }
});

/**
 * GET /api/v1/properties/admin/stats
 * Get admin statistics (requires admin authentication)
 */
router.get('/admin/stats', requireAdmin, async (req, res) => {
  try {
    const stats = await query(`
      SELECT
        COUNT(*) as total_properties,
        COUNT(CASE WHEN verified = true THEN 1 END) as verified_properties,
        COUNT(CASE WHEN verified = false AND status = 'pending' THEN 1 END) as pending_properties,
        COUNT(CASE WHEN status = 'rejected' THEN 1 END) as rejected_properties,
        AVG(price) as avg_price,
        COUNT(CASE WHEN created_at >= NOW() - INTERVAL '7 days' THEN 1 END) as new_this_week
      FROM properties
    `);

    const result = stats.rows[0];

    res.status(200).json({
      success: true,
      stats: {
        total: parseInt(result.total_properties),
        verified: parseInt(result.verified_properties),
        pending: parseInt(result.pending_properties),
        rejected: parseInt(result.rejected_properties),
        avgPrice: parseFloat(result.avg_price) || 0,
        newThisWeek: parseInt(result.new_this_week)
      }
    });
  } catch (error) {
    console.error('Error fetching admin stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch admin statistics',
      error: error.message
    });
  }
});

module.exports = router;

