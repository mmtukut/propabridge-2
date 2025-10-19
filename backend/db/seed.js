require('dotenv').config();
const { Pool } = require('pg');

// Database connection configuration
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

// Sample property data
const sampleProperties = [
  {
    type: '3 Bed Flat',
    location: 'Wuse 2, Abuja',
    price: 2500000,
    bedrooms: 3,
    features: '24/7 power, parking, gated community, swimming pool',
    verified: true,
    owner_id: 'owner_123',
  },
  {
    type: '2 Bed Flat',
    location: 'Maitama, Abuja',
    price: 3500000,
    bedrooms: 2,
    features: 'Fully furnished, gym, 24/7 security, backup generator',
    verified: true,
    owner_id: 'owner_456',
  },
  {
    type: '3 Bed Duplex',
    location: 'Gwarinpa, Abuja',
    price: 4000000,
    bedrooms: 3,
    features: 'Garden, BQ, solar power, water treatment plant',
    verified: true,
    owner_id: 'owner_789',
  },
  {
    type: '4 Bed Detached House',
    location: 'Asokoro, Abuja',
    price: 7500000,
    bedrooms: 4,
    features: 'Maid\'s quarters, swimming pool, smart home system, CCTV',
    verified: true,
    owner_id: 'owner_101',
  },
  {
    type: '1 Bed Apartment',
    location: 'Lekki Phase 1, Lagos',
    price: 2200000,
    bedrooms: 1,
    features: 'Fully furnished, 24/7 electricity, swimming pool, gym',
    verified: true,
    owner_id: 'owner_202',
  },
  {
    type: '5 Bed Mansion',
    location: 'Ikoyi, Lagos',
    price: 15000000,
    bedrooms: 5,
    features: 'Cinema room, wine cellar, elevator, 24/7 security',
    verified: true,
    owner_id: 'owner_303',
  },
  {
    type: '2 Bed Flat',
    location: 'GRA, Port Harcourt',
    price: 2800000,
    bedrooms: 2,
    features: 'Fully furnished, backup generator, water treatment',
    verified: true,
    owner_id: 'owner_404',
  },
  {
    type: '3 Bed Terrace',
    location: 'Jabi, Abuja',
    price: 3200000,
    bedrooms: 3,
    features: 'BQ, parking space, 24/7 security',
    verified: false, // This one is not verified
    owner_id: 'owner_505',
  },
];

// Function to seed the database
async function seedDatabase() {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // Clear existing data (optional, be careful in production)
    await client.query('TRUNCATE TABLE properties RESTART IDENTITY CASCADE');
    
    // Insert sample properties
    for (const property of sampleProperties) {
      const query = {
        text: `
          INSERT INTO properties (
            type, location, price, bedrooms, features, verified, owner_id
          ) VALUES ($1, $2, $3, $4, $5, $6, $7)
          RETURNING *
        `,
        values: [
          property.type,
          property.location,
          property.price,
          property.bedrooms,
          property.features,
          property.verified,
          property.owner_id
        ]
      };
      
      await client.query(query);
    }
    
    await client.query('COMMIT');
    console.log('✅ Database seeded successfully!');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error seeding database:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Run the seed function
seedDatabase().catch(console.error);
