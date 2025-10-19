require('dotenv').config();
const { Pool } = require('pg');

// Database connection configuration
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

// Sample property data - 50 realistic Nigerian properties
const sampleProperties = [
  // ABUJA PROPERTIES (Wuse 2 Area)
  { type: '3 Bed Flat', location: 'Wuse 2, Abuja', price: 2500000, bedrooms: 3, bathrooms: 3, area: 180, features: '24/7 power, parking, gated community, swimming pool', amenities: ['parking', 'power', 'security', 'pool'], status: 'active', verified: true, owner_id: 'owner_001' },
  { type: '2 Bed Flat', location: 'Wuse 2, Abuja', price: 2000000, bedrooms: 2, bathrooms: 2, area: 120, features: 'Fully serviced, backup generator, water treatment', amenities: ['parking', 'power', 'water'], status: 'active', verified: true, owner_id: 'owner_002' },
  { type: '4 Bed Duplex', location: 'Wuse 2, Abuja', price: 4500000, bedrooms: 4, bathrooms: 4, area: 250, features: 'BQ, solar power, study room, balcony', amenities: ['parking', 'power', 'security', 'bq'], status: 'active', verified: true, owner_id: 'owner_003' },
  { type: '3 Bed Flat', location: 'Wuse 2, Abuja', price: 2800000, bedrooms: 3, bathrooms: 3, area: 200, features: 'Modern kitchen, pop ceiling, wardrobe', amenities: ['parking', 'power', 'water'], status: 'active', verified: true, owner_id: 'owner_004' },
  
  // MAITAMA (Premium Area)
  { type: '2 Bed Flat', location: 'Maitama, Abuja', price: 3500000, bedrooms: 2, bathrooms: 2, area: 150, features: 'Fully furnished, gym, 24/7 security, backup generator', amenities: ['parking', 'power', 'security', 'gym', 'pool'], status: 'active', verified: true, owner_id: 'owner_005' },
  { type: '5 Bed Detached', location: 'Maitama, Abuja', price: 12000000, bedrooms: 5, bathrooms: 5, area: 400, features: 'Swimming pool, cinema room, maid quarters, smart home', amenities: ['parking', 'power', 'security', 'pool', 'gym', 'bq'], status: 'active', verified: true, owner_id: 'owner_006' },
  { type: '3 Bed Apartment', location: 'Maitama, Abuja', price: 5000000, bedrooms: 3, bathrooms: 3, area: 220, features: 'Penthouse, panoramic view, fitted kitchen', amenities: ['parking', 'power', 'security', 'gym'], status: 'active', verified: true, owner_id: 'owner_007' },
  { type: '4 Bed Terrace', location: 'Maitama, Abuja', price: 8000000, bedrooms: 4, bathrooms: 4, area: 300, features: 'Corner piece, garden, BQ, CCTV', amenities: ['parking', 'power', 'security', 'bq'], status: 'active', verified: true, owner_id: 'owner_008' },
  
  // GWARINPA (Family Area)
  { type: '3 Bed Duplex', location: 'Gwarinpa, Abuja', price: 4000000, bedrooms: 3, bathrooms: 3, area: 240, features: 'Garden, BQ, solar power, water treatment plant', amenities: ['parking', 'power', 'water', 'bq'], status: 'active', verified: true, owner_id: 'owner_009' },
  { type: '2 Bed Flat', location: 'Gwarinpa, Abuja', price: 1800000, bedrooms: 2, bathrooms: 2, area: 110, features: 'Estate, security, prepaid meter', amenities: ['parking', 'power', 'security'], status: 'active', verified: true, owner_id: 'owner_010' },
  { type: '4 Bed Duplex', location: 'Gwarinpa, Abuja', price: 4500000, bedrooms: 4, bathrooms: 4, area: 280, features: 'Spacious compound, borehole, generator', amenities: ['parking', 'power', 'water'], status: 'active', verified: true, owner_id: 'owner_011' },
  { type: '3 Bed Flat', location: 'Gwarinpa, Abuja', price: 2200000, bedrooms: 3, bathrooms: 2, area: 150, features: 'Ground floor, tiles, wardrobe', amenities: ['parking', 'security'], status: 'active', verified: true, owner_id: 'owner_012' },
  
  // ASOKORO (Diplomatic Area)
  { type: '4 Bed Detached', location: 'Asokoro, Abuja', price: 7500000, bedrooms: 4, bathrooms: 4, area: 350, features: 'Maid\'s quarters, swimming pool, smart home system, CCTV', amenities: ['parking', 'power', 'security', 'pool', 'bq'], status: 'active', verified: true, owner_id: 'owner_013' },
  { type: '6 Bed Mansion', location: 'Asokoro, Abuja', price: 20000000, bedrooms: 6, bathrooms: 6, area: 600, features: 'Golf course view, elevator, cinema, wine cellar', amenities: ['parking', 'power', 'security', 'pool', 'gym', 'bq'], status: 'active', verified: true, owner_id: 'owner_014' },
  { type: '3 Bed Flat', location: 'Asokoro, Abuja', price: 4500000, bedrooms: 3, bathrooms: 3, area: 200, features: 'High-rise building, 24/7 concierge, backup power', amenities: ['parking', 'power', 'security', 'gym'], status: 'active', verified: true, owner_id: 'owner_015' },
  
  // JABI (Vibrant Area)
  { type: '3 Bed Terrace', location: 'Jabi, Abuja', price: 3200000, bedrooms: 3, bathrooms: 3, area: 180, features: 'BQ, parking space, 24/7 security', amenities: ['parking', 'security', 'bq'], status: 'pending', verified: false, owner_id: 'owner_016' },
  { type: '2 Bed Flat', location: 'Jabi, Abuja', price: 1900000, bedrooms: 2, bathrooms: 2, area: 120, features: 'Close to Jabi Lake, modern finishing', amenities: ['parking', 'power'], status: 'active', verified: true, owner_id: 'owner_017' },
  { type: '4 Bed Duplex', location: 'Jabi, Abuja', price: 5500000, bedrooms: 4, bathrooms: 4, area: 300, features: 'Fully detached, large compound, gate house', amenities: ['parking', 'power', 'security', 'water'], status: 'active', verified: true, owner_id: 'owner_018' },
  { type: '1 Bed Studio', location: 'Jabi, Abuja', price: 1200000, bedrooms: 1, bathrooms: 1, area: 60, features: 'Serviced apartment, wifi, cable TV', amenities: ['power', 'security'], status: 'active', verified: true, owner_id: 'owner_019' },
  
  // GARKI (Central Area)
  { type: '3 Bed Flat', location: 'Garki 2, Abuja', price: 2300000, bedrooms: 3, bathrooms: 2, area: 140, features: 'Central location, shopping complex nearby', amenities: ['parking', 'power'], status: 'active', verified: true, owner_id: 'owner_020' },
  { type: '2 Bed Flat', location: 'Garki 1, Abuja', price: 1700000, bedrooms: 2, bathrooms: 2, area: 100, features: 'Quiet estate, functional amenities', amenities: ['parking', 'security'], status: 'active', verified: true, owner_id: 'owner_021' },
  
  // LAGOS PROPERTIES (Lekki Area)
  { type: '1 Bed Apartment', location: 'Lekki Phase 1, Lagos', price: 2200000, bedrooms: 1, bathrooms: 1, area: 80, features: 'Fully furnished, 24/7 electricity, swimming pool, gym', amenities: ['parking', 'power', 'security', 'pool', 'gym'], status: 'active', verified: true, owner_id: 'owner_022' },
  { type: '3 Bed Flat', location: 'Lekki Phase 1, Lagos', price: 3500000, bedrooms: 3, bathrooms: 3, area: 180, features: 'Waterfront view, modern kitchen, fitted wardrobes', amenities: ['parking', 'power', 'security', 'pool'], status: 'active', verified: true, owner_id: 'owner_023' },
  { type: '4 Bed Terrace', location: 'Lekki Phase 1, Lagos', price: 5000000, bedrooms: 4, bathrooms: 4, area: 250, features: 'BQ, solar inverter, smart home features', amenities: ['parking', 'power', 'security', 'bq'], status: 'active', verified: true, owner_id: 'owner_024' },
  { type: '2 Bed Flat', location: 'Lekki Phase 2, Lagos', price: 2800000, bedrooms: 2, bathrooms: 2, area: 130, features: 'Estate with swimming pool, gym, playground', amenities: ['parking', 'power', 'security', 'pool', 'gym'], status: 'active', verified: true, owner_id: 'owner_025' },
  { type: '5 Bed Detached', location: 'Lekki Phase 1, Lagos', price: 10000000, bedrooms: 5, bathrooms: 5, area: 400, features: 'Waterfront, private jetty, cinema room', amenities: ['parking', 'power', 'security', 'pool', 'gym', 'bq'], status: 'active', verified: true, owner_id: 'owner_026' },
  
  // VICTORIA ISLAND (Premium Lagos)
  { type: '5 Bed Mansion', location: 'Victoria Island, Lagos', price: 15000000, bedrooms: 5, bathrooms: 5, area: 500, features: 'Cinema room, wine cellar, elevator, 24/7 security', amenities: ['parking', 'power', 'security', 'pool', 'gym', 'bq'], status: 'active', verified: true, owner_id: 'owner_027' },
  { type: '3 Bed Penthouse', location: 'Victoria Island, Lagos', price: 8000000, bedrooms: 3, bathrooms: 3, area: 280, features: 'Ocean view, rooftop terrace, smart automation', amenities: ['parking', 'power', 'security', 'gym', 'pool'], status: 'active', verified: true, owner_id: 'owner_028' },
  { type: '2 Bed Apartment', location: 'Victoria Island, Lagos', price: 4000000, bedrooms: 2, bathrooms: 2, area: 150, features: 'Serviced, concierge, backup power', amenities: ['parking', 'power', 'security', 'gym'], status: 'active', verified: true, owner_id: 'owner_029' },
  
  // IKOYI (Elite Lagos)
  { type: '4 Bed Duplex', location: 'Ikoyi, Lagos', price: 12000000, bedrooms: 4, bathrooms: 4, area: 350, features: 'Private estate, tennis court, clubhouse', amenities: ['parking', 'power', 'security', 'pool', 'gym', 'bq'], status: 'active', verified: true, owner_id: 'owner_030' },
  { type: '3 Bed Flat', location: 'Ikoyi, Lagos', price: 6000000, bedrooms: 3, bathrooms: 3, area: 220, features: 'High-rise, panoramic view, 24/7 concierge', amenities: ['parking', 'power', 'security', 'gym', 'pool'], status: 'active', verified: true, owner_id: 'owner_031' },
  
  // IKEJA (Business District Lagos)
  { type: '3 Bed Flat', location: 'Ikeja GRA, Lagos', price: 2800000, bedrooms: 3, bathrooms: 2, area: 160, features: 'Close to airport, generator, borehole', amenities: ['parking', 'power', 'security'], status: 'active', verified: true, owner_id: 'owner_032' },
  { type: '2 Bed Flat', location: 'Ikeja, Lagos', price: 2000000, bedrooms: 2, bathrooms: 2, area: 110, features: 'Gated estate, playground, security', amenities: ['parking', 'security'], status: 'active', verified: true, owner_id: 'owner_033' },
  { type: '4 Bed Duplex', location: 'Ikeja GRA, Lagos', price: 5500000, bedrooms: 4, bathrooms: 4, area: 280, features: 'Spacious, BQ, solar system', amenities: ['parking', 'power', 'security', 'bq'], status: 'active', verified: true, owner_id: 'owner_034' },
  
  // AJAH (Affordable Lagos)
  { type: '2 Bed Flat', location: 'Ajah, Lagos', price: 1500000, bedrooms: 2, bathrooms: 2, area: 100, features: 'New development, tiled floors', amenities: ['parking'], status: 'active', verified: true, owner_id: 'owner_035' },
  { type: '3 Bed Flat', location: 'Ajah, Lagos', price: 2000000, bedrooms: 3, bathrooms: 2, area: 140, features: 'Estate with security, borehole', amenities: ['parking', 'security', 'water'], status: 'active', verified: true, owner_id: 'owner_036' },
  { type: '4 Bed Terrace', location: 'Ajah, Lagos', price: 3500000, bedrooms: 4, bathrooms: 3, area: 200, features: 'BQ, parking, street lights', amenities: ['parking', 'bq'], status: 'active', verified: false, owner_id: 'owner_037' },
  
  // MARYLAND/GBAGADA (Mainland Lagos)
  { type: '3 Bed Flat', location: 'Maryland, Lagos', price: 2200000, bedrooms: 3, bathrooms: 2, area: 130, features: 'Central location, commercial area nearby', amenities: ['parking', 'power'], status: 'active', verified: true, owner_id: 'owner_038' },
  { type: '2 Bed Flat', location: 'Gbagada, Lagos', price: 1800000, bedrooms: 2, bathrooms: 2, area: 110, features: 'Quiet neighborhood, functional facilities', amenities: ['parking', 'security'], status: 'active', verified: true, owner_id: 'owner_039' },
  
  // PORT HARCOURT
  { type: '2 Bed Flat', location: 'GRA, Port Harcourt', price: 2800000, bedrooms: 2, bathrooms: 2, area: 130, features: 'Fully furnished, backup generator, water treatment', amenities: ['parking', 'power', 'water'], status: 'active', verified: true, owner_id: 'owner_040' },
  { type: '3 Bed Flat', location: 'GRA, Port Harcourt', price: 3500000, bedrooms: 3, bathrooms: 3, area: 180, features: 'Serviced estate, 24/7 security', amenities: ['parking', 'power', 'security', 'water'], status: 'active', verified: true, owner_id: 'owner_041' },
  { type: '4 Bed Duplex', location: 'Old GRA, Port Harcourt', price: 6000000, bedrooms: 4, bathrooms: 4, area: 300, features: 'Spacious compound, BQ, solar backup', amenities: ['parking', 'power', 'security', 'bq'], status: 'active', verified: true, owner_id: 'owner_042' },
  
  // More Diverse Abuja Properties
  { type: '2 Bed Flat', location: 'Apo, Abuja', price: 1400000, bedrooms: 2, bathrooms: 2, area: 90, features: 'Budget-friendly, good road network', amenities: ['parking'], status: 'active', verified: true, owner_id: 'owner_043' },
  { type: '3 Bed Flat', location: 'Lugbe, Abuja', price: 1600000, bedrooms: 3, bathrooms: 2, area: 120, features: 'Close to airport, new development', amenities: ['parking', 'security'], status: 'active', verified: true, owner_id: 'owner_044' },
  { type: '4 Bed Duplex', location: 'Lifecamp, Abuja', price: 4000000, bedrooms: 4, bathrooms: 4, area: 260, features: 'BQ, tarred road, borehole', amenities: ['parking', 'bq', 'water'], status: 'active', verified: true, owner_id: 'owner_045' },
  { type: '3 Bed Terrace', location: 'Kuje, Abuja', price: 2500000, bedrooms: 3, bathrooms: 3, area: 170, features: 'Serene environment, affordable', amenities: ['parking', 'water'], status: 'active', verified: false, owner_id: 'owner_046' },
  
  // More Lagos Properties
  { type: '3 Bed Flat', location: 'Surulere, Lagos', price: 2300000, bedrooms: 3, bathrooms: 2, area: 140, features: 'Central Lagos, good neighborhood', amenities: ['parking', 'security'], status: 'active', verified: true, owner_id: 'owner_047' },
  { type: '2 Bed Flat', location: 'Yaba, Lagos', price: 2000000, bedrooms: 2, bathrooms: 2, area: 110, features: 'Close to universities, vibrant area', amenities: ['parking'], status: 'active', verified: true, owner_id: 'owner_048' },
  { type: '4 Bed Duplex', location: 'Magodo, Lagos', price: 5000000, bedrooms: 4, bathrooms: 4, area: 280, features: 'Gated estate, BQ, solar system', amenities: ['parking', 'power', 'security', 'bq'], status: 'active', verified: true, owner_id: 'owner_049' },
  { type: '1 Bed Apartment', location: 'Sangotedo, Lagos', price: 1300000, bedrooms: 1, bathrooms: 1, area: 70, features: 'New Lekki corridor, affordable', amenities: ['parking'], status: 'active', verified: true, owner_id: 'owner_050' },
];

// Function to seed the database
async function seedDatabase() {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    console.log('🌱 Starting database seeding...');
    
    // Clear existing data (optional, be careful in production)
    console.log('📦 Clearing existing data...');
    await client.query('TRUNCATE TABLE property_images, property_views, inquiries, properties, users RESTART IDENTITY CASCADE');
    
    // Create sample users (landlords)
    console.log('👥 Creating sample users...');
    const userIds = {};
    for (let i = 1; i <= 50; i++) {
      const phone = `+23480${String(i).padStart(8, '0')}`;
      const role = i <= 5 ? 'landlord' : 'user';
      const result = await client.query(
        `INSERT INTO users (phone, name, role, verified) 
         VALUES ($1, $2, $3, $4) 
         RETURNING id`,
        [phone, `User ${i}`, role, true]
      );
      userIds[`owner_${String(i).padStart(3, '0')}`] = result.rows[0].id;
    }
    
    // Insert sample properties
    console.log('🏠 Inserting 50 properties...');
    let insertedCount = 0;
    for (const property of sampleProperties) {
      const query = {
        text: `
          INSERT INTO properties (
            user_id, type, location, price, bedrooms, bathrooms, area,
            features, amenities, status, verified, owner_id, created_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
          RETURNING *
        `,
        values: [
          userIds[property.owner_id] || null,
          property.type,
          property.location,
          property.price,
          property.bedrooms,
          property.bathrooms,
          property.area,
          property.features,
          JSON.stringify(property.amenities),
          property.status,
          property.verified,
          property.owner_id,
          new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000) // Random date within last 30 days
        ]
      };
      
      await client.query(query);
      insertedCount++;
      if (insertedCount % 10 === 0) {
        console.log(`  ✓ Inserted ${insertedCount}/50 properties`);
      }
    }
    
    await client.query('COMMIT');
    console.log('\n✅ Database seeded successfully!');
    console.log(`   - ${insertedCount} properties created`);
    console.log(`   - ${Object.keys(userIds).length} users created`);
    console.log(`   - Ready for production!\n`);
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
