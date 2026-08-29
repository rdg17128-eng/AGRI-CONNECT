-- ==========================================
-- SUPABASE BACKEND SCHEMA SETUP SCRIPT
-- Copy and run these queries in your Supabase SQL Editor
-- (https://supabase.com/dashboard/project/gxogbczrbmjlzcadvafu/sql)
-- ==========================================

-- 1. Create farmers table
CREATE TABLE IF NOT EXISTS farmers (
    phone TEXT PRIMARY KEY,
    pin TEXT NOT NULL,
    role TEXT,
    name TEXT,
    "altPhone" TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Create buyers table
CREATE TABLE IF NOT EXISTS buyers (
    phone TEXT PRIMARY KEY,
    pin TEXT NOT NULL,
    role TEXT,
    name TEXT,
    "altPhone" TEXT,
    "gstNumber" TEXT,
    "businessType" TEXT,
    "buyingCapacity" TEXT,
    "preferredCrops" TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Create consumers table
CREATE TABLE IF NOT EXISTS consumers (
    phone TEXT PRIMARY KEY,
    pin TEXT NOT NULL,
    role TEXT,
    name TEXT,
    "altPhone" TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Create mills table
CREATE TABLE IF NOT EXISTS mills (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_phone TEXT NOT NULL,
    mill_name TEXT NOT NULL,
    mill_type TEXT NOT NULL,
    capacity NUMERIC,
    requirements TEXT,
    "selectedCrops" TEXT[] NOT NULL,
    location_name TEXT,
    latitude NUMERIC NOT NULL,
    longitude NUMERIC NOT NULL,
    has_cold_storage BOOLEAN DEFAULT FALSE NOT NULL,
    prices JSONB DEFAULT '{}'::jsonb,
    status TEXT DEFAULT 'verified' NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. Create crops table
CREATE TABLE IF NOT EXISTS crops (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_phone TEXT NOT NULL,
    user_role TEXT NOT NULL,
    crop_name TEXT NOT NULL,
    location_name TEXT,
    latitude NUMERIC NOT NULL,
    longitude NUMERIC NOT NULL,
    acres NUMERIC NOT NULL,
    added_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. Create enquiries table
CREATE TABLE IF NOT EXISTS enquiries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    mill_id TEXT NOT NULL,
    mill_name TEXT,
    buyer_phone TEXT NOT NULL,
    buyer_name TEXT,
    farmer_phone TEXT NOT NULL,
    farmer_name TEXT,
    crop_name TEXT NOT NULL,
    acres NUMERIC,
    quantity NUMERIC,
    status TEXT DEFAULT 'pending' NOT NULL,
    price_per_quintal NUMERIC,
    total_price NUMERIC,
    crop_id TEXT,
    with_transport BOOLEAN DEFAULT FALSE NOT NULL,
    message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    farmer_lat NUMERIC,
    farmer_lng NUMERIC,
    farmer_location_name TEXT,
    mill_lat NUMERIC,
    mill_lng NUMERIC,
    mill_location_name TEXT,
    distance NUMERIC
);

-- ==========================================
-- Disable Row Level Security (RLS) for testing
-- (You can enable RLS and add policies later)
-- ==========================================
ALTER TABLE farmers DISABLE ROW LEVEL SECURITY;
ALTER TABLE buyers DISABLE ROW LEVEL SECURITY;
ALTER TABLE consumers DISABLE ROW LEVEL SECURITY;
ALTER TABLE mills DISABLE ROW LEVEL SECURITY;
ALTER TABLE crops DISABLE ROW LEVEL SECURITY;
ALTER TABLE enquiries DISABLE ROW LEVEL SECURITY;
