-- ============================================================
-- GREEN LIFE FLOWERS — SUPABASE DATABASE SCHEMA
-- ============================================================
-- Run this in your Supabase Dashboard → SQL Editor → New Query
-- This creates the table that stores all your website data.
-- ============================================================

-- 1. Create the main data table
-- Each row stores one type of data (products, orders, FAQ, etc.)
-- as a JSON value. This keeps things simple and matches how
-- the website already works.
CREATE TABLE IF NOT EXISTS site_data (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Enable Row Level Security (required by Supabase)
ALTER TABLE site_data ENABLE ROW LEVEL SECURITY;

-- 3. Allow the website to READ all data (public access)
CREATE POLICY "Allow public read" ON site_data
  FOR SELECT USING (true);

-- 4. Allow the admin panel to WRITE data
-- (The admin panel is already password-protected)
CREATE POLICY "Allow public insert" ON site_data
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public update" ON site_data
  FOR UPDATE USING (true);

CREATE POLICY "Allow public delete" ON site_data
  FOR DELETE USING (true);

-- Done! Your database is ready.
-- The website will automatically populate it with data on first use.
