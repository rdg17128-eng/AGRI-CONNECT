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
    enquiry_code TEXT UNIQUE NOT NULL,
    mill_id TEXT NOT NULL,
    mill_name TEXT,
    buyer_phone TEXT NOT NULL,
    buyer_name TEXT,
    farmer_phone TEXT NOT NULL,
    farmer_name TEXT,
    farmer_id TEXT,
    crop_id TEXT,
    crop_name TEXT NOT NULL,
    acres NUMERIC,
    quantity NUMERIC,
    expected_price NUMERIC,
    offered_price NUMERIC,
    total_price NUMERIC,
    status TEXT DEFAULT 'PENDING' NOT NULL,
    load_status TEXT DEFAULT 'PENDING' NOT NULL,
    transport_required BOOLEAN DEFAULT FALSE NOT NULL,
    vehicle_capacity TEXT,
    vehicle_type TEXT,
    pickup_location TEXT,
    delivery_location TEXT,
    pickup_date TEXT,
    transport_instructions TEXT,
    message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    accepted_at TIMESTAMP WITH TIME ZONE,
    accepted_by TEXT,
    received_at TIMESTAMP WITH TIME ZONE,
    received_by TEXT,
    farmer_lat NUMERIC,
    farmer_lng NUMERIC,
    farmer_location_name TEXT,
    mill_lat NUMERIC,
    mill_lng NUMERIC,
    mill_location_name TEXT,
    distance NUMERIC
);

-- 7. Create enquiry_qr_tokens table
CREATE TABLE IF NOT EXISTS enquiry_qr_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    enquiry_id TEXT NOT NULL,
    enquiry_code TEXT NOT NULL,
    token TEXT UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT TRUE NOT NULL
);

-- 8. Create loads table
CREATE TABLE IF NOT EXISTS loads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    enquiry_id TEXT NOT NULL,
    enquiry_code TEXT NOT NULL,
    farmer_id TEXT NOT NULL,
    farmer_name TEXT,
    mill_id TEXT NOT NULL,
    mill_name TEXT,
    crop_id TEXT,
    crop_name TEXT NOT NULL,
    quantity NUMERIC,
    acres NUMERIC,
    price NUMERIC,
    transport_method TEXT,
    status TEXT DEFAULT 'RECEIVED' NOT NULL,
    received_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    received_by TEXT NOT NULL
);

-- 9. Create transport_providers table
CREATE TABLE IF NOT EXISTS transport_providers (
    phone TEXT PRIMARY KEY,
    pin TEXT NOT NULL,
    name TEXT NOT NULL,
    role TEXT DEFAULT 'transporters',
    alt_phone TEXT,
    vehicle_number TEXT NOT NULL,
    vehicle_type TEXT NOT NULL,
    capacity NUMERIC NOT NULL,
    current_lat NUMERIC,
    current_lng NUMERIC,
    current_location_name TEXT,
    service_area TEXT,
    price_per_km NUMERIC,
    rating NUMERIC DEFAULT 4.9,
    availability TEXT DEFAULT 'AVAILABLE',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 10. Create transport_requests table
CREATE TABLE IF NOT EXISTS transport_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transport_code TEXT UNIQUE NOT NULL,
    enquiry_id TEXT NOT NULL,
    enquiry_code TEXT NOT NULL,
    farmer_id TEXT NOT NULL,
    farmer_name TEXT,
    farmer_phone TEXT,
    mill_id TEXT NOT NULL,
    mill_name TEXT,
    crop_name TEXT NOT NULL,
    quantity NUMERIC NOT NULL,
    pickup_lat NUMERIC,
    pickup_lng NUMERIC,
    pickup_address TEXT,
    delivery_lat NUMERIC,
    delivery_lng NUMERIC,
    delivery_address TEXT,
    required_capacity NUMERIC NOT NULL,
    vehicle_type TEXT,
    pickup_date TEXT,
    distance NUMERIC,
    status TEXT DEFAULT 'SEARCHING' NOT NULL,
    assigned_provider_id TEXT,
    assigned_provider_name TEXT,
    assigned_provider_phone TEXT,
    vehicle_number TEXT,
    final_price NUMERIC,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 11. Create transport_quotes table
CREATE TABLE IF NOT EXISTS transport_quotes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transport_request_id TEXT NOT NULL,
    transport_code TEXT NOT NULL,
    provider_id TEXT NOT NULL,
    provider_name TEXT NOT NULL,
    provider_phone TEXT NOT NULL,
    vehicle_number TEXT,
    vehicle_type TEXT,
    vehicle_capacity NUMERIC,
    price NUMERIC NOT NULL,
    estimated_time TEXT,
    status TEXT DEFAULT 'PENDING' NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ==========================================
-- Disable Row Level Security (RLS) for testing or enable with policies
-- ==========================================
ALTER TABLE farmers DISABLE ROW LEVEL SECURITY;
ALTER TABLE buyers DISABLE ROW LEVEL SECURITY;
ALTER TABLE consumers DISABLE ROW LEVEL SECURITY;
ALTER TABLE mills DISABLE ROW LEVEL SECURITY;
ALTER TABLE crops DISABLE ROW LEVEL SECURITY;
ALTER TABLE enquiries DISABLE ROW LEVEL SECURITY;
ALTER TABLE enquiry_qr_tokens DISABLE ROW LEVEL SECURITY;
ALTER TABLE loads DISABLE ROW LEVEL SECURITY;
ALTER TABLE transport_providers DISABLE ROW LEVEL SECURITY;
ALTER TABLE transport_requests DISABLE ROW LEVEL SECURITY;
ALTER TABLE transport_quotes DISABLE ROW LEVEL SECURITY;
