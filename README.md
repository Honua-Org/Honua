# Honua Social

A social platform built with React, TypeScript, and Supabase.

## Features

- User authentication
- Profile management with avatar uploads
- Social feed
- Rewards system
- Real-time updates

## Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- Supabase CLI
- Git

## Project Setup

1. Clone the repository and install dependencies:

```bash
git clone <repository-url>
cd honua-social
yarn install # or npm install
```

2. Set up environment variables:

Copy `.env.example` to `.env` and update the values:

```bash
cp .env.example .env
```

Required environment variables:

```plaintext
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Supabase Setup

1. Install Supabase CLI:

```bash
npm install -g supabase
```

2. Start Supabase locally:

```bash
supabase start
```

3. Run database migrations:

```bash
supabase migration up
```

This will apply all migrations in the `supabase/migrations` folder, including:
- Initial schema setup
- Storage configuration for avatars and media
- User rewards system

### Storage Setup

The project uses Supabase Storage for managing user uploads. The following buckets are automatically created through migrations:

- `avatars`: For user profile pictures
- `posts`: For social feed media content

Storage policies are configured to:
- Allow authenticated users to upload their own avatars
- Allow public read access to avatars
- Restrict post uploads to authenticated users

## Development

Start the development server:

```bash
yarn dev # or npm run dev
```

The app will be available at `http://localhost:5173`

## Database Schema

Key tables in the database:

- `profiles`: User profile information
- `posts`: Social feed content
- `user_rewards`: Tracks user achievements and points

## Contributing

1. Create a feature branch:
```bash
git checkout -b feature/your-feature-name
```

2. Make your changes and commit:
```bash
git commit -m "Add your feature description"
```

3. Push to your branch and create a pull request

## License

MIT
