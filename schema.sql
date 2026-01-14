-- AIYA Affiliate Registration Database Schema
-- Compatible with NeonDB (PostgreSQL)

-- Drop old registrations table
DROP TABLE IF EXISTS registrations CASCADE;

-- Create affiliates table
CREATE TABLE IF NOT EXISTS affiliates (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  phone VARCHAR(20) NOT NULL,
  affiliate_code VARCHAR(50) NOT NULL UNIQUE,
  selected_product VARCHAR(50) NOT NULL,
  note TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_affiliates_email ON affiliates(email);
CREATE INDEX IF NOT EXISTS idx_affiliates_affiliate_code ON affiliates(affiliate_code);
CREATE INDEX IF NOT EXISTS idx_affiliates_created_at ON affiliates(created_at);

-- Example insert (for testing)
-- INSERT INTO affiliates (name, email, phone, affiliate_code, selected_product, note)
-- VALUES ('John Doe', 'john@example.com', '0812345678', 'AFFILIATE001', 'single_package', 'Test affiliate');
