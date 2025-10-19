const express = require('express');
const router = express.Router();
const Property = require('../models/Property');
const matchingService = require('../services/matchingService');

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
    const { phone } = req.body;

    // TODO: Save view to property_views table
    // For now, just acknowledge
    
    res.status(200).json({
      success: true,
      message: 'View tracked'
    });
  } catch (error) {
    console.error('Error tracking view:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to track view'
    });
  }
});

/**
 * POST /api/v1/properties/images
 * Upload property images (requires authentication)
 */
router.post('/images', async (req, res) => {
  try {
    // TODO: Implement image upload with multer and Cloudinary
    // For now, return placeholder
    
    res.status(501).json({
      success: false,
      message: 'Image upload not yet implemented'
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

module.exports = router;

