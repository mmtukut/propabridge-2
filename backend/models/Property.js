const { query } = require('../config/db');

class Property {
  // Get all properties (with optional filters)
  static async findAll(filters = {}) {
    let queryText = 'SELECT * FROM properties WHERE 1=1';
    const queryParams = [];
    let paramCount = 1;

    // Add filters dynamically
    if (filters.location) {
      queryText += ` AND location ILIKE $${paramCount}`;
      queryParams.push(`%${filters.location}%`);
      paramCount++;
    }

    if (filters.maxPrice) {
      queryText += ` AND price <= $${paramCount}`;
      queryParams.push(filters.maxPrice);
      paramCount++;
    }

    if (filters.minBedrooms) {
      queryText += ` AND bedrooms >= $${paramCount}`;
      queryParams.push(filters.minBedrooms);
      paramCount++;
    }

    if (filters.propertyType) {
      queryText += ` AND type = $${paramCount}`;
      queryParams.push(filters.propertyType);
      paramCount++;
    }

    // Only show verified properties by default
    if (filters.verified !== false) {
      queryText += ` AND verified = $${paramCount}`;
      queryParams.push(true);
      paramCount++;
    }

    // Add ordering and limiting
    queryText += ' ORDER BY created_at DESC';
    
    if (filters.limit) {
      queryText += ` LIMIT $${paramCount}`;
      queryParams.push(filters.limit);
    }

    const result = await query(queryText, queryParams);
    return result.rows;
  }

  // Find a property by ID
  static async findById(id) {
    const result = await query('SELECT * FROM properties WHERE id = $1', [id]);
    return result.rows[0];
  }

  // Create a new property
  static async create(propertyData) {
    const {
      type,
      location,
      price,
      bedrooms,
      features,
      verified = false,
      ownerId,
    } = propertyData;

    const result = await query(
      `INSERT INTO properties (
        type, location, price, bedrooms, features, verified, owner_id, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW()) RETURNING *`,
      [type, location, price, bedrooms, features, verified, ownerId]
    );

    return result.rows[0];
  }

  // Update a property
  static async update(id, updates) {
    const fields = [];
    const values = [];
    let paramCount = 1;

    // Build the SET clause dynamically based on provided updates
    Object.entries(updates).forEach(([key, value]) => {
      fields.push(`${key} = $${paramCount}`);
      values.push(value);
      paramCount++;
    });

    // Add the ID to the values array for the WHERE clause
    values.push(id);

    const queryText = `
      UPDATE properties 
      SET ${fields.join(', ')}
      WHERE id = $${paramCount}
      RETURNING *
    `;

    const result = await query(queryText, values);
    return result.rows[0];
  }

  // Delete a property
  static async delete(id) {
    const result = await query('DELETE FROM properties WHERE id = $1 RETURNING *', [id]);
    return result.rows[0];
  }

  /**
   * Finds properties based on a set of criteria extracted by the AI
   * @param {object} criteria - The search criteria (e.g., { location, maxPrice, bedrooms })
   * @returns {Promise<Array>} - A list of matching properties
   */
  static async findByCriteria(criteria) {
    let queryText = 'SELECT * FROM properties WHERE verified = true';
    const queryParams = [];
    let paramCount = 1;

    if (criteria.location) {
      queryText += ` AND location ILIKE $${paramCount}`;
      queryParams.push(`%${criteria.location}%`);
      paramCount++;
    }

    if (criteria.propertyType) {
      queryText += ` AND type ILIKE $${paramCount}`;
      queryParams.push(`%${criteria.propertyType}%`);
      paramCount++;
    }

    if (criteria.minPrice) {
      queryText += ` AND price >= $${paramCount}`;
      queryParams.push(criteria.minPrice);
      paramCount++;
    }

    if (criteria.maxPrice) {
      queryText += ` AND price <= $${paramCount}`;
      queryParams.push(criteria.maxPrice);
      paramCount++;
    }

    if (criteria.bedrooms) {
      // Allow for queries like "at least 3 bedrooms"
      if (typeof criteria.bedrooms === 'string' && criteria.bedrooms.startsWith('>=')) {
        queryText += ` AND bedrooms >= $${paramCount}`;
        queryParams.push(parseInt(criteria.bedrooms.replace('>=', ''), 10));
      } else {
        queryText += ` AND bedrooms = $${paramCount}`;
        queryParams.push(criteria.bedrooms);
      }
      paramCount++;
    }

    queryText += ' ORDER BY created_at DESC LIMIT 10'; // Limit to 10 results for now

    try {
      const result = await query(queryText, queryParams);
      return result.rows;
    } catch (error) {
      console.error('Error in findByCriteria:', error);
      throw error;
    }
  }

  // Search properties using AI-powered matching
  static async findMatches(userQuery) {
    // This is a placeholder for the AI matching logic
    // In a real implementation, this would use NLP to understand the query
    // and return the most relevant properties
    
    // For now, we'll do a simple text search on the location and features
    const result = await query(
      `SELECT *, 
        ts_rank(
          to_tsvector('english', location || ' ' || features || ' ' || type),
          plainto_tsquery('english', $1)
        ) as rank
       FROM properties
       WHERE to_tsvector('english', location || ' ' || features || ' ' || type) @@ plainto_tsquery('english', $1)
       AND verified = true
       ORDER BY rank DESC
       LIMIT 5`,
      [userQuery]
    );

    return result.rows;
  }
}

module.exports = Property;
