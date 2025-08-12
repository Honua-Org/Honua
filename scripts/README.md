# User Email Export Scripts

This directory contains scripts to export user emails from Supabase authentication.

## Files

- `export-user-emails.sql` - SQL script to set up the email export system
- `export-emails.js` - Node.js script to export emails to CSV/TXT files

## Setup

### 1. Run the SQL Script

First, execute the SQL script in your Supabase SQL editor:

```sql
-- Copy and paste the contents of export-user-emails.sql
-- into your Supabase SQL editor and run it
```

This will:
- Create a `user_emails` table to store email data
- Set up automatic syncing with `auth.users` via triggers
- Create a `user_emails_export` view for easy querying
- Populate the table with existing users

### 2. Environment Variables

Make sure your `.env.local` file contains:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

**Important:** You need the `SUPABASE_SERVICE_ROLE_KEY` (not the anon key) to access user data.

### 3. Install Dependencies

If not already installed:

```bash
npm install @supabase/supabase-js dotenv
```

## Usage

### Export All User Emails

```bash
node scripts/export-emails.js
```

This creates a CSV file with:
- Email address
- Email confirmation status
- Registration date
- Email confirmation date

### Export Only Confirmed Emails

```bash
node scripts/export-emails.js --confirmed-only
```

This creates a simple text file with one confirmed email per line.

## Output

Exported files are saved to the `exports/` directory:
- `user-emails-YYYY-MM-DD.csv` - Full export with metadata
- `confirmed-emails-YYYY-MM-DD.txt` - Confirmed emails only

## How It Works

### Automatic Sync

The system automatically:
1. **Syncs existing users** when you first run the SQL script
2. **Adds new users** whenever someone registers (via database trigger)
3. **Updates email status** when users confirm their emails

### Manual Queries

You can also query directly in Supabase:

```sql
-- All emails
SELECT * FROM user_emails_export;

-- Only confirmed emails
SELECT email FROM user_emails_export WHERE email_status = 'confirmed';

-- Recent registrations (last 30 days)
SELECT email FROM user_emails_export 
WHERE user_registered_at >= NOW() - INTERVAL '30 days';
```

## Security

- The `user_emails` table uses Row Level Security (RLS)
- Only service role and users can access their own data
- The export script requires service role key for admin access

## Troubleshooting

### "Missing environment variables" error
Make sure your `.env.local` file has both `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`.

### "Permission denied" error
Ensure you're using the service role key, not the anon key.

### "Table doesn't exist" error
Run the SQL script first to create the necessary tables and triggers.

### No emails exported
Check if the trigger is working by manually inserting a test user or running the initial sync query again.