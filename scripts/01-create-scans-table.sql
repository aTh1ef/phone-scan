-- Create the scans table for storing phone scan data
CREATE TABLE IF NOT EXISTS scans (
  id SERIAL PRIMARY KEY,
  imei VARCHAR(255) NOT NULL,
  model VARCHAR(255) NOT NULL,
  storage VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create an index on created_at for faster sorting
CREATE INDEX IF NOT EXISTS idx_scans_created_at ON scans(created_at DESC);
