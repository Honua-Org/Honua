# Invite System Setup Instructions

## Database Setup Required

The invite system has been implemented but requires manual database setup since the automated script encountered issues with the `exec_sql` function.

### Steps to Complete Setup:

1. **Go to your Supabase Dashboard**
   - Navigate to https://supabase.com
   - Open your project dashboard

2. **Open SQL Editor**
   - Click on "SQL Editor" in the left sidebar
   - Create a new query

3. **Run the Database Migration**
   - Copy the entire contents of `scripts/create-invites-table.sql`
   - Paste it into the SQL Editor
   - Click "Run" to execute the SQL

4. **Verify Setup**
   - Check that the `invites` table was created
   - Verify that the functions `get_invite_leaderboard()` and `add_user_points()` were created
   - Confirm that Row Level Security policies are in place

## Features Implemented

✅ **Invite Button**: Added to the main header (desktop view)
✅ **Invite Modal**: Shows invite link, user stats, and leaderboard rank
✅ **API Endpoints**: 
   - `/api/invites/generate` - Generate unique invite codes
   - `/api/invites/stats` - Get user's invite statistics
   - `/api/invites/validate/[code]` - Validate invite codes
   - `/api/invites/accept/[code]` - Accept invitations
✅ **Invite Page**: `/invite/[code]` - Landing page for invite links
✅ **Database Schema**: Complete invites table with RLS policies
✅ **Leaderboard System**: Rank users by successful invites
✅ **Points System**: Bonus points for successful referrals

## How It Works

1. **User clicks "Invite Friends" button** in the header
2. **Modal opens** showing:
   - Unique invite link
   - Number of users they've invited
   - Their rank on the invite leaderboard
3. **User shares the invite link** with friends
4. **Friends click the link** and land on the invite page
5. **Friends sign up** using the invite code
6. **Both users get bonus points** (inviter: 100 points, new user: 50 points)
7. **Leaderboard updates** with new invite counts

## Testing

Once the database is set up:
1. Click the "Invite Friends" button in the header
2. Copy the generated invite link
3. Open the link in an incognito window
4. Test the signup flow

## Notes

- The invite system uses nanoid for generating unique invite codes
- Invites expire after 30 days by default
- Row Level Security ensures users can only see their own invite data
- The system includes fallback logic for calculating leaderboard ranks