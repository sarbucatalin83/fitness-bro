# FitnessBro

A mobile-first PWA fitness tracking app built with Angular 21 and Supabase.

## Project Structure

```
fitness-bro/
├── frontend/           # Angular 21 PWA
├── backend/            # Supabase (Edge Functions, Database)
├── .github/workflows/  # CI/CD pipelines
└── package.json        # Monorepo workspace config
```

## Prerequisites

- Node.js 20+
- npm 10+
- Supabase CLI (`npm install -g supabase`)
- Docker (for local Supabase development)

## Getting Started

### 1. Clone and Install

```bash
git clone <repo-url>
cd fitness-bro
npm install
```

### 2. Set up Supabase Locally

```bash
cd backend
supabase start
```

This starts local Supabase services (PostgreSQL, Auth, Storage, etc.)

### 3. Apply Database Migrations

```bash
cd backend
supabase db push
```

### 4. Seed the Database

```bash
cd backend
supabase db reset
```

### 5. Configure Frontend Environment

The frontend environment files are pre-configured with the Supabase project credentials.

For local development with a local Supabase instance, update `frontend/src/environments/environment.ts` with your local credentials from `supabase status` output.

### 6. Configure Backend Environment

Copy the example environment file and fill in your credentials:

```bash
cd backend
cp .env.example .env
# Edit .env with your actual SUPABASE_SERVICE_ROLE_KEY and DB_PASSWORD
```

### 7. Start Development Server

```bash
# From root directory
npm run frontend
```

Or:

```bash
cd frontend
npm start
```

Open http://localhost:4200

## Available Scripts

### Root Level

| Script | Description |
|--------|-------------|
| `npm run frontend` | Start Angular dev server |
| `npm run frontend:build` | Build Angular for production |
| `npm run backend:start` | Start local Supabase |
| `npm run backend:stop` | Stop local Supabase |
| `npm run backend:db:push` | Push database migrations |
| `npm run backend:functions` | Serve Edge Functions locally |

### Backend

| Script | Description |
|--------|-------------|
| `npm run start` | Start Supabase |
| `npm run stop` | Stop Supabase |
| `npm run db:push` | Push migrations |
| `npm run db:reset` | Reset and seed database |
| `npm run functions:serve` | Serve functions locally |
| `npm run functions:deploy` | Deploy functions to production |
| `npm run gen:types` | Generate TypeScript types from DB |

## Deployment

### GitHub Secrets Required

| Secret | Description |
|--------|-------------|
| `SUPABASE_ACCESS_TOKEN` | Supabase CLI access token |
| `SUPABASE_PROJECT_REF` | Project reference ID |
| `SUPABASE_DB_PASSWORD` | Database password |
| `SUPABASE_URL` | Production Supabase URL |
| `SUPABASE_ANON_KEY` | Production anon key |

### Deploy Frontend

Push to `main` branch with changes in `frontend/` directory.

### Deploy Backend

Push to `main` branch with changes in `backend/` directory.

### Manual Deployment

```bash
# Frontend
cd frontend
npm run build
# Upload dist/ to Supabase Storage

# Backend
cd backend
supabase link --project-ref <project-ref>
supabase db push
supabase functions deploy
```

## Tech Stack

- **Frontend**: Angular 21, Tailwind CSS, PWA
- **Backend**: Supabase (PostgreSQL, Edge Functions, Auth)
- **CI/CD**: GitHub Actions
- **Hosting**: Supabase Storage (frontend), Supabase (backend)

## Features

- **Programs**: Create and manage workout programs
- **Exercises**: Browse exercise database with videos and tips
- **Workout Tracking**: Log sets, reps, and weight in real-time
- **Progress**: Weekly volume charts and statistics
- **PWA**: Install on mobile for native-like experience
- **Auth**: Email/password authentication via Supabase

## License

MIT
