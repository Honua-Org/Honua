# Honua Social Setup Guide

## Prerequisites

- Node.js 18+ installed
- A Supabase account and project

## Environment Setup

### 1. Supabase Configuration

The upload error you're experiencing is likely due to missing Supabase environment variables. Follow these steps:

1. **Create a Supabase Project**
   - Go to [https://supabase.com](https://supabase.com)
   - Create a new project or use an existing one

2. **Get Your API Credentials**
   - In your Supabase dashboard, go to **Settings > API**
   - Copy the following values:
     - Project URL
     - anon public key
     - service_role key (keep this secret!)

3. **Update Environment Variables**
   - Open the `.env.local` file in the project root
   - Replace the placeholder values with your actual Supabase credentials:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-actual-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-actual-service-role-key
   ```

### 2. Database Setup

1. **Run Database Schema**
   - In your Supabase dashboard, go to **SQL Editor**
   - Run the SQL commands from `scripts/create-database.sql`
   - Optionally run `scripts/seed-data.sql` for sample data

### 3. Storage Setup

1. **Create Storage Buckets**
   - In your Supabase dashboard, go to **Storage**
   - Create the following buckets:
     - `avatars` (for user profile pictures)
     - `post-media` (for post images)
     - `cover-images` (for user cover photos)

2. **Set Bucket Policies**
   - Make sure the buckets are publicly readable
   - Set appropriate upload policies for authenticated users

### 4. Authentication Setup

1. **Configure Auth Settings**
   - In Supabase dashboard, go to **Authentication > Settings**
   - Add your site URL to **Site URL** (e.g., `http://localhost:3000`)
   - Configure any additional auth providers if needed

## Running the Application

1. **Install Dependencies**
   ```bash
   npm install
   # or
   pnpm install
   ```

2. **Start Development Server**
   ```bash
   npm run dev
   # or
   pnpm dev
   ```

3. **Access the Application**
   - Open [http://localhost:3000](http://localhost:3000) in your browser

## Troubleshooting Upload Errors

If you're still experiencing upload errors after setup:

1. **Check Browser Console**
   - Look for specific error messages
   - Verify that environment variables are loaded

2. **Verify Supabase Connection**
   - Test authentication by trying to sign up/login
   - Check if the Supabase client is properly initialized

3. **Storage Bucket Permissions**
   - Ensure buckets exist and have proper read/write policies
   - Check that file types and sizes are within limits

4. **Network Issues**
   - Verify internet connection
   - Check if Supabase services are operational

## Common Issues

- **"Upload error: {}"** - Usually indicates missing environment variables
- **Authentication errors** - Check if user is properly logged in
- **Storage errors** - Verify bucket existence and permissions
- **File type errors** - Only JPEG, PNG, WebP, and GIF files are supported
- **File size errors** - Maximum file size is 10MB