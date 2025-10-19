-- ===================================
-- USERS TABLE
-- ===================================
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  phone VARCHAR(20) UNIQUE NOT NULL,
  name VARCHAR(100),
  email VARCHAR(100),
  role VARCHAR(20) DEFAULT 'user', -- 'user', 'landlord', 'agent', 'admin'
  verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_active TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ===================================
-- PROPERTIES TABLE (ENHANCED)
-- ===================================
CREATE TABLE IF NOT EXISTS properties (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  type VARCHAR(100) NOT NULL,
  location VARCHAR(200) NOT NULL,
  price DECIMAL(12, 2) NOT NULL,
  bedrooms INT NOT NULL,
  bathrooms INT DEFAULT 1,
  area DECIMAL(10, 2), -- in square meters
  features TEXT,
  amenities JSONB, -- ['parking', 'pool', 'gym', 'security', 'power', 'water']
  status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'active', 'rented', 'sold', 'inactive'
  verified BOOLEAN DEFAULT FALSE,
  owner_id VARCHAR(100), -- legacy field for backward compatibility
  coordinates POINT, -- For map integration (latitude, longitude)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ===================================
-- PROPERTY IMAGES TABLE
-- ===================================
CREATE TABLE IF NOT EXISTS property_images (
  id SERIAL PRIMARY KEY,
  property_id INTEGER REFERENCES properties(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  is_primary BOOLEAN DEFAULT FALSE,
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ===================================
-- PROPERTY VIEWS TABLE (Analytics)
-- ===================================
CREATE TABLE IF NOT EXISTS property_views (
  id SERIAL PRIMARY KEY,
  property_id INTEGER REFERENCES properties(id) ON DELETE CASCADE,
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  phone VARCHAR(20), -- For non-logged-in users
  viewed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ===================================
-- INQUIRIES TABLE
-- ===================================
CREATE TABLE IF NOT EXISTS inquiries (
  id SERIAL PRIMARY KEY,
  property_id INTEGER REFERENCES properties(id) ON DELETE CASCADE,
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  phone VARCHAR(20) NOT NULL,
  message TEXT,
  status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'responded', 'closed'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ===================================
-- CONVERSATIONS TABLE
-- ===================================
CREATE TABLE IF NOT EXISTS conversations (
  id SERIAL PRIMARY KEY,
  phone VARCHAR(20) NOT NULL,
  message TEXT,
  intent VARCHAR(50),
  response JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ===================================
-- OTP TABLE (for phone authentication)
-- ===================================
CREATE TABLE IF NOT EXISTS otp_codes (
  id SERIAL PRIMARY KEY,
  phone VARCHAR(20) NOT NULL,
  code VARCHAR(6) NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ===================================
-- INDEXES FOR PERFORMANCE
-- ===================================
-- Users indexes
CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- Properties indexes
CREATE INDEX IF NOT EXISTS idx_properties_location ON properties(location);
CREATE INDEX IF NOT EXISTS idx_properties_price ON properties(price);
CREATE INDEX IF NOT EXISTS idx_properties_bedrooms ON properties(bedrooms);
CREATE INDEX IF NOT EXISTS idx_properties_verified ON properties(verified);
CREATE INDEX IF NOT EXISTS idx_properties_status ON properties(status);
CREATE INDEX IF NOT EXISTS idx_properties_user ON properties(user_id);
CREATE INDEX IF NOT EXISTS idx_properties_created_at ON properties(created_at);

-- Property images indexes
CREATE INDEX IF NOT EXISTS idx_property_images_property ON property_images(property_id);
CREATE INDEX IF NOT EXISTS idx_property_images_primary ON property_images(is_primary);

-- Property views indexes
CREATE INDEX IF NOT EXISTS idx_property_views_property ON property_views(property_id);
CREATE INDEX IF NOT EXISTS idx_property_views_user ON property_views(user_id);
CREATE INDEX IF NOT EXISTS idx_property_views_date ON property_views(viewed_at);

-- Inquiries indexes
CREATE INDEX IF NOT EXISTS idx_inquiries_property ON inquiries(property_id);
CREATE INDEX IF NOT EXISTS idx_inquiries_user ON inquiries(user_id);
CREATE INDEX IF NOT EXISTS idx_inquiries_status ON inquiries(status);
CREATE INDEX IF NOT EXISTS idx_inquiries_phone ON inquiries(phone);

-- Conversations indexes
CREATE INDEX IF NOT EXISTS idx_conversations_phone ON conversations(phone);
CREATE INDEX IF NOT EXISTS idx_conversations_created_at ON conversations(created_at);

-- OTP indexes
CREATE INDEX IF NOT EXISTS idx_otp_phone ON otp_codes(phone);
CREATE INDEX IF NOT EXISTS idx_otp_expires ON otp_codes(expires_at);

-- Enable full-text search for properties
ALTER TABLE properties 
  ADD COLUMN IF NOT EXISTS search_vector tsvector 
  GENERATED ALWAYS AS (
    setweight(to_tsvector('english', COALESCE(type, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(location, '')), 'B') ||
    setweight(to_tsvector('english', COALESCE(features, '')), 'C')
  ) STORED;

-- Create index for full-text search
CREATE INDEX IF NOT EXISTS idx_properties_search 
  ON properties USING GIN (search_vector);

-- Create a function to update the updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ===================================
-- TRIGGERS FOR AUTO-UPDATE TIMESTAMPS
-- ===================================
DO $$
BEGIN
  -- For properties table
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_properties_updated_at') THEN
    CREATE TRIGGER update_properties_updated_at
    BEFORE UPDATE ON properties
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
  
  -- For conversations table
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_conversations_updated_at') THEN
    CREATE TRIGGER update_conversations_updated_at
    BEFORE UPDATE ON conversations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
  
  -- For inquiries table
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_inquiries_updated_at') THEN
    CREATE TRIGGER update_inquiries_updated_at
    BEFORE UPDATE ON inquiries
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END
$$;

-- ===================================
-- CLEANUP FUNCTION (Delete expired OTPs)
-- ===================================
CREATE OR REPLACE FUNCTION cleanup_expired_otps()
RETURNS void AS $$
BEGIN
  DELETE FROM otp_codes WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- ===================================
-- INITIAL DATA (Default admin user)
-- ===================================
INSERT INTO users (phone, name, role, verified) 
VALUES ('+2348055269579', 'Admin', 'admin', true)
ON CONFLICT (phone) DO NOTHING;
