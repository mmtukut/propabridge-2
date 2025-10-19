const Property = require('../models/Property');

/**
 * Property Matching Service with AI-powered Scoring Algorithm
 * Ranks properties based on multiple criteria to find the best matches
 */

/**
 * Location similarity scoring
 * @param {string} requestedLocation - User's requested location
 * @param {string} propertyLocation - Property's actual location
 * @returns {number} - Score from 0 to 100
 */
const calculateLocationScore = (requestedLocation, propertyLocation) => {
  if (!requestedLocation || !propertyLocation) return 0;

  const requested = requestedLocation.toLowerCase().trim();
  const property = propertyLocation.toLowerCase().trim();

  // Exact match
  if (property.includes(requested) || requested.includes(property)) {
    return 100;
  }

  // Location aliases (handle common abbreviations)
  const aliases = {
    'wuse': ['wuse 2', 'wuse2', 'wuse ii'],
    'gwarinpa': ['gwarinpa estate', 'gwagwalada'],
    'maitama': ['maitama district'],
    'v.i': ['victoria island', 'vi'],
    'vi': ['victoria island', 'v.i'],
    'lekki': ['lekki phase 1', 'lekki phase 2', 'lekki peninsula'],
    'gra': ['government reserved area', 'g.r.a'],
  };

  // Check if locations are aliases of each other
  for (const [key, values] of Object.entries(aliases)) {
    if ((requested.includes(key) && values.some(v => property.includes(v))) ||
        (property.includes(key) && values.some(v => requested.includes(v)))) {
      return 90;
    }
  }

  // Same city but different area
  const cities = ['abuja', 'lagos', 'port harcourt', 'ibadan', 'kano'];
  for (const city of cities) {
    if (requested.includes(city) && property.includes(city)) {
      return 50;
    }
  }

  // Different location
  return 0;
};

/**
 * Price fit scoring
 * @param {number} requestedMaxPrice - User's maximum budget
 * @param {number} requestedMinPrice - User's minimum budget (optional)
 * @param {number} propertyPrice - Property's actual price
 * @returns {number} - Score from 0 to 100
 */
const calculatePriceScore = (requestedMaxPrice, requestedMinPrice, propertyPrice) => {
  if (!propertyPrice) return 0;

  // If within budget range
  if (requestedMinPrice && propertyPrice >= requestedMinPrice && propertyPrice <= requestedMaxPrice) {
    // Perfect if in the middle 50% of the range
    const range = requestedMaxPrice - requestedMinPrice;
    const position = (propertyPrice - requestedMinPrice) / range;
    if (position >= 0.25 && position <= 0.75) {
      return 100;
    }
    return 90;
  }

  // If only max price specified
  if (!requestedMinPrice && propertyPrice <= requestedMaxPrice) {
    // Score based on how far below max price
    const percentage = propertyPrice / requestedMaxPrice;
    if (percentage <= 0.8) return 100; // 20% below budget is perfect
    if (percentage <= 0.9) return 95;
    return 90;
  }

  // Slightly over budget (up to 10%)
  if (propertyPrice <= requestedMaxPrice * 1.1) {
    return 70;
  }

  // Significantly over budget (10-20%)
  if (propertyPrice <= requestedMaxPrice * 1.2) {
    return 40;
  }

  // Way over budget
  return 0;
};

/**
 * Feature/Amenities match scoring
 * @param {array} requestedAmenities - User's requested amenities
 * @param {array} propertyAmenities - Property's actual amenities
 * @returns {number} - Score from 0 to 100
 */
const calculateAmenitiesScore = (requestedAmenities, propertyAmenities) => {
  if (!requestedAmenities || requestedAmenities.length === 0) return 100;
  if (!propertyAmenities || propertyAmenities.length === 0) return 0;

  const requested = requestedAmenities.map(a => a.toLowerCase());
  const property = propertyAmenities.map(a => a.toLowerCase());

  // Count matching amenities
  const matches = requested.filter(amenity => 
    property.some(p => p.includes(amenity) || amenity.includes(p))
  );

  // Calculate percentage match
  const matchPercentage = (matches.length / requested.length) * 100;

  return Math.round(matchPercentage);
};

/**
 * Property condition/newness scoring
 * @param {date} createdAt - When property was listed
 * @param {boolean} verified - If property is verified
 * @returns {number} - Score from 0 to 100
 */
const calculateConditionScore = (createdAt, verified) => {
  let score = verified ? 100 : 60; // Verified properties start at 100

  // Penalize old listings (might be outdated)
  const daysSinceCreated = (Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60 * 24);
  
  if (daysSinceCreated > 60) {
    score -= 20; // Old listing, might not be available
  } else if (daysSinceCreated > 30) {
    score -= 10; // Somewhat old
  }

  return Math.max(score, 0);
};

/**
 * Landlord responsiveness scoring
 * TODO: Implement based on historical response time data
 * @param {number} userId - Property owner's user ID
 * @returns {number} - Score from 0 to 100
 */
const calculateResponsivenessScore = (userId) => {
  // Placeholder: In production, calculate based on:
  // - Average response time to inquiries
  // - Percentage of inquiries responded to
  // - User ratings/reviews
  return 80; // Default good score
};

/**
 * Days on market scoring (newer listings might be more available)
 * @param {date} createdAt - When property was listed
 * @returns {number} - Score from 0 to 100
 */
const calculateFreshnessScore = (createdAt) => {
  const daysSinceCreated = (Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60 * 24);
  
  if (daysSinceCreated <= 7) return 100;  // Very fresh (within a week)
  if (daysSinceCreated <= 14) return 90;  // Fresh (within 2 weeks)
  if (daysSinceCreated <= 30) return 70;  // Recent (within a month)
  if (daysSinceCreated <= 60) return 50;  // Older
  return 30; // Very old
};

/**
 * Calculate overall match score for a property
 * @param {object} property - Property object
 * @param {object} criteria - User's search criteria
 * @returns {number} - Overall match score (0-100)
 */
const calculateMatchScore = (property, criteria) => {
  // Scoring weights (must add up to 100)
  const weights = {
    location: 30,
    price: 25,
    amenities: 20,
    condition: 10,
    responsiveness: 10,
    freshness: 5
  };

  // Calculate individual scores
  const scores = {
    location: calculateLocationScore(criteria.location, property.location),
    price: calculatePriceScore(criteria.maxPrice, criteria.minPrice, property.price),
    amenities: calculateAmenitiesScore(criteria.amenities, property.amenities),
    condition: calculateConditionScore(property.created_at, property.verified),
    responsiveness: calculateResponsivenessScore(property.user_id),
    freshness: calculateFreshnessScore(property.created_at)
  };

  // Calculate weighted average
  const overallScore = Object.keys(weights).reduce((total, key) => {
    return total + (scores[key] * weights[key] / 100);
  }, 0);

  return Math.round(overallScore);
};

/**
 * Find and rank properties based on user criteria
 * @param {object} criteria - Search criteria
 * @returns {Promise<array>} - Ranked properties with match scores
 */
const findMatches = async (criteria) => {
  try {
    // Get properties from database using basic filters
    const properties = await Property.findByCriteria({
      location: criteria.location,
      maxPrice: criteria.maxPrice,
      minPrice: criteria.minPrice,
      bedrooms: criteria.bedrooms,
      propertyType: criteria.propertyType
    });

    // Calculate match score for each property
    const scoredProperties = properties.map(property => ({
      ...property,
      matchScore: calculateMatchScore(property, criteria),
      // Include breakdown for transparency
      scoreBreakdown: {
        location: calculateLocationScore(criteria.location, property.location),
        price: calculatePriceScore(criteria.maxPrice, criteria.minPrice, property.price),
        amenities: calculateAmenitiesScore(criteria.amenities, property.amenities),
        condition: calculateConditionScore(property.created_at, property.verified),
        responsiveness: calculateResponsivenessScore(property.user_id),
        freshness: calculateFreshnessScore(property.created_at)
      }
    }));

    // Sort by match score (highest first)
    scoredProperties.sort((a, b) => b.matchScore - a.matchScore);

    // Filter out very low matches (below 40)
    const goodMatches = scoredProperties.filter(p => p.matchScore >= 40);

    return goodMatches;
  } catch (error) {
    console.error('Error in findMatches:', error);
    throw error;
  }
};

/**
 * Get smart suggestions when no exact matches found
 * @param {object} criteria - Original search criteria
 * @returns {Promise<object>} - Alternative suggestions
 */
const getSmartSuggestions = async (criteria) => {
  const suggestions = {
    nearbyAreas: [],
    cheaperOptions: [],
    premiumOptions: [],
    relaxedCriteria: null
  };

  try {
    // Find properties in same city but different areas
    if (criteria.location) {
      const city = criteria.location.split(',')[1]?.trim() || criteria.location;
      const cityProperties = await Property.findByCriteria({
        location: city,
        maxPrice: criteria.maxPrice,
        bedrooms: criteria.bedrooms
      });
      
      suggestions.nearbyAreas = cityProperties
        .filter(p => !p.location.toLowerCase().includes(criteria.location.toLowerCase()))
        .slice(0, 3);
    }

    // Find similar but cheaper options
    if (criteria.maxPrice) {
      const cheaperProperties = await Property.findByCriteria({
        location: criteria.location,
        maxPrice: criteria.maxPrice * 0.8, // 20% cheaper
        bedrooms: criteria.bedrooms
      });
      suggestions.cheaperOptions = cheaperProperties.slice(0, 3);
    }

    // Find premium options (slightly over budget but might be worth it)
    if (criteria.maxPrice) {
      const premiumProperties = await Property.findByCriteria({
        location: criteria.location,
        minPrice: criteria.maxPrice,
        maxPrice: criteria.maxPrice * 1.2, // Up to 20% more
        bedrooms: criteria.bedrooms
      });
      suggestions.premiumOptions = premiumProperties.slice(0, 3);
    }

    // Relaxed criteria (fewer bedrooms or different type)
    if (criteria.bedrooms && criteria.bedrooms > 1) {
      const relaxedProperties = await Property.findByCriteria({
        location: criteria.location,
        maxPrice: criteria.maxPrice,
        bedrooms: criteria.bedrooms - 1
      });
      suggestions.relaxedCriteria = {
        bedrooms: criteria.bedrooms - 1,
        properties: relaxedProperties.slice(0, 3)
      };
    }

    return suggestions;
  } catch (error) {
    console.error('Error getting smart suggestions:', error);
    return suggestions;
  }
};

/**
 * Track user preferences for personalization
 * TODO: Implement machine learning-based recommendations
 * @param {number} userId - User ID
 * @param {object} viewedProperty - Property user viewed
 */
const trackUserPreference = async (userId, viewedProperty) => {
  // Store in property_views table for future personalization
  // In production: Use this data to:
  // - Learn user preferences over time
  // - Recommend similar properties
  // - Adjust match scores based on user history
  
  console.log(`📊 Tracking preference for user ${userId}: ${viewedProperty.type} in ${viewedProperty.location}`);
};

module.exports = {
  calculateMatchScore,
  findMatches,
  getSmartSuggestions,
  trackUserPreference,
  // Export individual scoring functions for testing
  calculateLocationScore,
  calculatePriceScore,
  calculateAmenitiesScore
};

