-- Organization Upgrade Schema
-- This script adds support for organization account upgrades

-- Add organization-related columns to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS account_type VARCHAR(20) DEFAULT 'individual' CHECK (account_type IN ('individual', 'organization', 'business'));
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS organization_name VARCHAR(255);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS organization_type VARCHAR(50);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS business_registration_number VARCHAR(100);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS tax_id VARCHAR(100);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS industry VARCHAR(100);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS company_size VARCHAR(50);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS founded_year INTEGER;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS headquarters_address TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS contact_phone VARCHAR(20);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS contact_email VARCHAR(255);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS organization_description TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS organization_mission TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS sustainability_goals TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS certifications TEXT[];
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS verified_organization BOOLEAN DEFAULT FALSE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS marketplace_access BOOLEAN DEFAULT FALSE;

-- Create organization upgrade requests table
CREATE TABLE IF NOT EXISTS organization_upgrade_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    request_type VARCHAR(20) NOT NULL CHECK (request_type IN ('organization', 'business')),
    organization_name VARCHAR(255) NOT NULL,
    organization_type VARCHAR(50),
    business_registration_number VARCHAR(100),
    tax_id VARCHAR(100),
    industry VARCHAR(100) NOT NULL,
    company_size VARCHAR(50),
    founded_year INTEGER,
    headquarters_address TEXT NOT NULL,
    contact_phone VARCHAR(20) NOT NULL,
    contact_email VARCHAR(255) NOT NULL,
    organization_description TEXT NOT NULL,
    organization_mission TEXT,
    sustainability_goals TEXT,
    certifications TEXT[],
    website_url VARCHAR(255),
    linkedin_url VARCHAR(255),
    supporting_documents TEXT[], -- URLs to uploaded documents
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'under_review', 'approved', 'rejected', 'requires_info')),
    admin_notes TEXT,
    reviewer_id UUID REFERENCES profiles(id),
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    reviewed_at TIMESTAMP WITH TIME ZONE,
    approved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create organization verification documents table
CREATE TABLE IF NOT EXISTS organization_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    upgrade_request_id UUID REFERENCES organization_upgrade_requests(id) ON DELETE CASCADE,
    document_type VARCHAR(50) NOT NULL, -- 'business_license', 'tax_certificate', 'incorporation_docs', etc.
    document_name VARCHAR(255) NOT NULL,
    document_url TEXT NOT NULL,
    file_size INTEGER,
    mime_type VARCHAR(100),
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create marketplace products table (for organizations)
CREATE TABLE IF NOT EXISTS marketplace_products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    seller_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    category VARCHAR(100) NOT NULL,
    subcategory VARCHAR(100),
    price DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',
    images TEXT[] NOT NULL,
    sustainability_features TEXT[],
    certifications TEXT[],
    availability_status VARCHAR(20) DEFAULT 'available' CHECK (availability_status IN ('available', 'out_of_stock', 'discontinued')),
    stock_quantity INTEGER,
    shipping_info TEXT,
    return_policy TEXT,
    tags TEXT[],
    featured BOOLEAN DEFAULT FALSE,
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'pending_review', 'active', 'inactive', 'rejected')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create organization badges table
CREATE TABLE IF NOT EXISTS organization_badges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    badge_type VARCHAR(50) NOT NULL, -- 'verified_org', 'sustainability_leader', 'carbon_neutral', etc.
    badge_name VARCHAR(100) NOT NULL,
    badge_description TEXT,
    badge_icon VARCHAR(255),
    issued_by VARCHAR(100),
    issued_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE,
    verification_url VARCHAR(255),
    active BOOLEAN DEFAULT TRUE
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_organization_upgrade_requests_user_id ON organization_upgrade_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_organization_upgrade_requests_status ON organization_upgrade_requests(status);
CREATE INDEX IF NOT EXISTS idx_organization_documents_upgrade_request_id ON organization_documents(upgrade_request_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_products_seller_id ON marketplace_products(seller_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_products_category ON marketplace_products(category);
CREATE INDEX IF NOT EXISTS idx_marketplace_products_status ON marketplace_products(status);
CREATE INDEX IF NOT EXISTS idx_organization_badges_organization_id ON organization_badges(organization_id);
CREATE INDEX IF NOT EXISTS idx_profiles_account_type ON profiles(account_type);

-- Enable Row Level Security
ALTER TABLE organization_upgrade_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketplace_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_badges ENABLE ROW LEVEL SECURITY;

-- RLS Policies for organization_upgrade_requests
CREATE POLICY "Users can view their own upgrade requests" ON organization_upgrade_requests
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own upgrade requests" ON organization_upgrade_requests
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own pending requests" ON organization_upgrade_requests
    FOR UPDATE USING (auth.uid() = user_id AND status = 'pending');

-- RLS Policies for organization_documents
CREATE POLICY "Users can view documents for their upgrade requests" ON organization_documents
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM organization_upgrade_requests our
            WHERE our.id = upgrade_request_id AND our.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can upload documents for their upgrade requests" ON organization_documents
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM organization_upgrade_requests our
            WHERE our.id = upgrade_request_id AND our.user_id = auth.uid()
        )
    );

-- RLS Policies for marketplace_products
CREATE POLICY "Organizations can manage their own products" ON marketplace_products
    FOR ALL USING (auth.uid() = seller_id);

CREATE POLICY "Everyone can view active products" ON marketplace_products
    FOR SELECT USING (status = 'active');

-- RLS Policies for organization_badges
CREATE POLICY "Everyone can view organization badges" ON organization_badges
    FOR SELECT USING (active = true);

CREATE POLICY "Organizations can view their own badges" ON organization_badges
    FOR SELECT USING (auth.uid() = organization_id);

-- Update profiles RLS to handle organization accounts
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;
CREATE POLICY "Public profiles are viewable by everyone" ON profiles
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile" ON profiles
    FOR UPDATE USING (auth.uid() = id);

-- Function to automatically approve organization upgrade
CREATE OR REPLACE FUNCTION approve_organization_upgrade(request_id UUID, reviewer_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    upgrade_request organization_upgrade_requests%ROWTYPE;
BEGIN
    -- Get the upgrade request
    SELECT * INTO upgrade_request
    FROM organization_upgrade_requests
    WHERE id = request_id AND status = 'under_review';
    
    IF NOT FOUND THEN
        RETURN FALSE;
    END IF;
    
    -- Update the user's profile
    UPDATE profiles SET
        account_type = upgrade_request.request_type,
        organization_name = upgrade_request.organization_name,
        organization_type = upgrade_request.organization_type,
        business_registration_number = upgrade_request.business_registration_number,
        tax_id = upgrade_request.tax_id,
        industry = upgrade_request.industry,
        company_size = upgrade_request.company_size,
        founded_year = upgrade_request.founded_year,
        headquarters_address = upgrade_request.headquarters_address,
        contact_phone = upgrade_request.contact_phone,
        contact_email = upgrade_request.contact_email,
        organization_description = upgrade_request.organization_description,
        organization_mission = upgrade_request.organization_mission,
        sustainability_goals = upgrade_request.sustainability_goals,
        certifications = upgrade_request.certifications,
        verified_organization = TRUE,
        marketplace_access = TRUE,
        website = COALESCE(upgrade_request.website_url, website),
        updated_at = NOW()
    WHERE id = upgrade_request.user_id;
    
    -- Update the upgrade request status
    UPDATE organization_upgrade_requests SET
        status = 'approved',
        reviewer_id = reviewer_user_id,
        reviewed_at = NOW(),
        approved_at = NOW(),
        updated_at = NOW()
    WHERE id = request_id;
    
    -- Add verified organization badge
    INSERT INTO organization_badges (organization_id, badge_type, badge_name, badge_description, badge_icon)
    VALUES (
        upgrade_request.user_id,
        'verified_org',
        'Verified Organization',
        'This organization has been verified by Honua Social',
        'verified-badge'
    );
    
    RETURN TRUE;
END;
$$;

-- Function to reject organization upgrade
CREATE OR REPLACE FUNCTION reject_organization_upgrade(request_id UUID, reviewer_user_id UUID, rejection_reason TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE organization_upgrade_requests SET
        status = 'rejected',
        reviewer_id = reviewer_user_id,
        reviewed_at = NOW(),
        admin_notes = rejection_reason,
        updated_at = NOW()
    WHERE id = request_id AND status IN ('pending', 'under_review');
    
    RETURN FOUND;
END;
$$;

-- Sample data can be inserted after real users exist in the profiles table
-- INSERT INTO organization_upgrade_requests (user_id, request_type, organization_name, organization_type, industry, headquarters_address, contact_phone, contact_email, organization_description, status) VALUES
-- ('real-user-uuid-here', 'organization', 'Sample Eco Foundation', 'Non-Profit', 'Environmental Conservation', '123 Green Street, Portland, OR', '+1-555-0123', 'contact@sampleeco.org', 'A non-profit organization dedicated to environmental conservation and sustainability education.', 'pending')
-- ON CONFLICT DO NOTHING;

COMMIT;