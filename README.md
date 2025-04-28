# Honua - Social Platform for Environmental Impact

## Overview
Honua is a modern social platform built to connect environmentally conscious individuals and communities. The platform enables users to share environmental initiatives, discuss sustainability practices, and collaborate on green projects.

## Contact & Support
For inquiries, feedback, or support, connect with us through:
- 📧 [Email](mailto:info@honua.green)
- [Twitter/X](https://x.com/Honua_Green)
- Connect with our CTO [Chidile](https://x.com/0xAfroTechBoss) on X

## Tech Stack

### Frontend
- React with TypeScript
- Vite for build tooling
- Supabase Client for authentication and real-time features
- Modern UI components and styling

### Backend
- Node.js with TypeScript
- Supabase for database and authentication
- RESTful API architecture

### Database
- PostgreSQL (via Supabase)
- Structured tables for:
  - User profiles
  - Communities
  - Posts
  - Comments
  - Social interactions
  - Followers
  - Link previews

## Features
- User authentication (email and Google OAuth)
- Profile management
- Social interactions (posts, comments, likes)
- Community creation and management
- Real-time updates
- Media sharing
- Explore feed

## Getting Started

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn
- Supabase account and project

### Frontend Setup
1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file with your Supabase credentials:
   ```env
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

### Backend Setup
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   ```bash
   cp .env.example .env
   ```
   Then edit `.env` with your configuration.

4. Start the development server:
   ```bash
   npm run dev
   ```

## Database Migrations
The project uses Supabase migrations for database schema management. Migrations are located in the `supabase/migrations` directory.

To apply migrations:
1. Install Supabase CLI
2. Run migrations:
   ```bash
   supabase migration up
   ```

## Project Structure
```
├── frontend/                # React frontend application
│   ├── src/
│   │   ├── api/            # API integration
│   │   ├── components/     # Reusable components
│   │   ├── contexts/       # React contexts
│   │   ├── lib/           # Utilities and configurations
│   │   ├── pages/         # Page components
│   │   └── services/      # Business logic services
├── backend/                # Node.js backend application
│   ├── src/
│   │   ├── routes/        # API routes
│   │   ├── types/         # TypeScript types
│   │   └── utils/         # Utility functions
└── supabase/              # Database migrations and configurations
    └── migrations/        # SQL migration files
```

## Contributing
We welcome contributions! Please read our contributing guidelines before submitting pull requests.

## License
This project is licensed under the MIT License - see the LICENSE file for details.
