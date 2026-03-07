# ⚓ SoT Clips

> The ultimate Sea of Thieves community clip showcase platform. Submit, discover, and share your finest moments on the high seas.

![SoT Clips Banner](https://i.imgur.com/placeholder.png)

---

## 🗺️ Table of Contents

- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [Features](#features)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Database Setup](#database-setup)
- [Twitch OAuth Setup](#twitch-oauth-setup)
- [Deployment on Coolify](#deployment-on-coolify)
- [API Reference](#api-reference)
- [Project Structure](#project-structure)
- [Security](#security)
- [Admin Guide](#admin-guide)

---

## Overview

SoT Clips is a community-driven platform where Sea of Thieves streamers can submit their Twitch clips for community review and showcase. The platform features Twitch authentication, admin moderation, tag-based categorization, and a pirate-themed UI.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 15 (App Router) |
| Styling | Tailwind CSS 3 + custom pirate theme |
| Animation | Framer Motion |
| Database | MariaDB via Prisma ORM |
| Auth | Twitch OAuth 2.0 + JWT (jose) |
| State | TanStack React Query v5 |
| Validation | Zod |
| Notifications | react-hot-toast |
| Deployment | Coolify (Nixpacks / Node.js) |

---

## Features

### 🏴‍☠️ Public
- Browse approved Sea of Thieves clips
- Filter by tags (Funny, Kill, Tuck, Highlight, etc.)
- Search by title or streamer name
- Paginated gallery with skeleton loading

### 👤 Authenticated Users (Twitch Login)
- Submit Twitch clips (SoT-only enforced via Twitch API)
- View personal dashboard with clip status
- Tag clips with up to 5 tags per submission

### 🛡️ Admin / Moderator
- View all pending, approved, and declined clips
- One-click approve / decline
- Platform statistics overview
- User management + role assignment

### 🔐 Security
- JWT sessions (3-day expiry, stored as httpOnly cookies)
- CORS: only whitelisted domains can call the API
- Clip creator must be a registered user (prevents spam)
- Sea of Thieves enforcement via Twitch Helix API game_id check

---

## Getting Started

### Prerequisites

- Node.js 18+
- MariaDB 10.6+
- A Twitch Developer Application

### Installation

```bash
# Clone repository
git clone https://github.com/your-org/sot-clips.git
cd sot-clips

# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Edit .env with your values (see below)

# Generate Prisma client
npm run db:generate

# Push schema to database (development)
npm run db:push

# Start development server
npm run dev
```

Visit `http://localhost:3000`

---

## Environment Variables

```env
# Database - MariaDB connection string
DATABASE_URL="mysql://user:password@localhost:3306/sot_clips"

# App URL (no trailing slash)
NEXTAUTH_URL="https://your-domain.com"

# Random string, min 32 chars (used for signing sessions)
NEXTAUTH_SECRET="your-super-secret-key-min-32-chars"

# Twitch Application credentials
TWITCH_CLIENT_ID="your-twitch-client-id"
TWITCH_CLIENT_SECRET="your-twitch-client-secret"

# JWT signing secret, min 32 chars
JWT_SECRET="your-jwt-secret-min-32-chars"

# Comma-separated list of allowed CORS origins
ALLOWED_ORIGINS="https://your-domain.com,https://www.your-domain.com"

# Public app URL (available in browser)
NEXT_PUBLIC_APP_URL="https://your-domain.com"
```

---

## Database Setup

SoT Clips uses **MariaDB** with **Prisma ORM**.

### Create Database

```sql
CREATE DATABASE sot_clips CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'sotclips'@'%' IDENTIFIED BY 'your-password';
GRANT ALL PRIVILEGES ON sot_clips.* TO 'sotclips'@'%';
FLUSH PRIVILEGES;
```

### Run Migrations

```bash
# Development (auto-apply schema)
npm run db:push

# Production (using migrations)
npm run db:migrate

# Open Prisma Studio (database GUI)
npm run db:studio
```

### Schema Overview

```
users        → Twitch-authenticated users with roles (USER/ADMIN/MODERATOR)
sessions     → JWT session tokens with 3-day expiry
clips        → Submitted Twitch clips with status (PENDING/APPROVED/DECLINED)
clip_tags    → Many-to-many tags per clip
```

### Make Yourself Admin

After first login, run this in your MariaDB client:

```sql
UPDATE users SET role = 'ADMIN' WHERE twitch_login = 'your-twitch-username';
```

---

## Twitch OAuth Setup

1. Go to [dev.twitch.tv/console](https://dev.twitch.tv/console)
2. Click **Register Your Application**
3. Set **OAuth Redirect URLs** to:
   ```
   https://your-domain.com/api/auth/callback
   http://localhost:3000/api/auth/callback  (for development)
   ```
4. Set **Category** to `Website Integration`
5. Copy **Client ID** and **Client Secret** to your `.env`

### Twitch Clip Embed Domain

The Twitch embed player requires your domain to be listed as a `parent` parameter. This is automatically handled using your `NEXTAUTH_URL` domain in the `buildEmbedUrl()` function.

---

## Deployment on Coolify

### Prerequisites on Coolify

1. A MariaDB database service
2. A Node.js application service
3. Nixpack build pack selected

### Steps

1. **Create a new application** in Coolify
   - Source: your Git repository
   - Build pack: **Nixpacks**
   - The `nixpacks.json` in the project root handles build + start commands

2. **Set Environment Variables** in Coolify's environment tab:
   ```
   DATABASE_URL=mysql://user:pass@mariadb-host:3306/sot_clips
   NEXTAUTH_URL=https://your-coolify-domain.com
   NEXTAUTH_SECRET=<generate with: openssl rand -base64 32>
   TWITCH_CLIENT_ID=...
   TWITCH_CLIENT_SECRET=...
   JWT_SECRET=<generate with: openssl rand -base64 32>
   ALLOWED_ORIGINS=https://your-coolify-domain.com
   NODE_ENV=production
   ```

3. **Set Port** to `3000`

4. **Deploy** — Coolify will:
   - Install Node.js dependencies
   - Generate Prisma client
   - Build Next.js
   - Run `prisma migrate deploy` on startup
   - Start the Next.js server

### nixpacks.json

```json
{
  "providers": ["node"],
  "buildCmd": "npm install && npm run db:generate && npm run build",
  "startCmd": "npm run db:migrate && npm start"
}
```

---

## API Reference

All API routes are under `/api/`.

### Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/auth/login` | Redirect to Twitch OAuth |
| `GET` | `/api/auth/callback` | Twitch OAuth callback (handles token exchange) |
| `GET/POST` | `/api/auth/logout` | Clear session cookie |
| `GET` | `/api/auth/me` | Get current authenticated user |

### Clips

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/api/clips` | None | List approved clips (paginated) |
| `POST` | `/api/clips` | Required | Submit a new clip |
| `GET` | `/api/clips/mine` | Required | Get your own clips |

#### GET /api/clips Query Parameters

| Param | Type | Description |
|-------|------|-------------|
| `page` | number | Page number (default: 1) |
| `limit` | number | Items per page (max: 50, default: 12) |
| `tag` | string | Filter by tag (e.g., `FUNNY`, `KILL`) |
| `search` | string | Search title / broadcaster |

#### POST /api/clips Request Body

```json
{
  "twitchUrl": "https://www.twitch.tv/user/clip/ClipId",
  "tags": ["FUNNY", "HIGHLIGHT"]
}
```

### Admin

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/api/admin/stats` | Admin/Mod | Platform statistics |
| `GET` | `/api/admin/clips` | Admin/Mod | All clips with filters |
| `PATCH` | `/api/admin/clips?id={id}` | Admin/Mod | Approve or decline a clip |
| `GET` | `/api/admin/users` | Admin/Mod | List all users |
| `PATCH` | `/api/admin/users?id={id}` | Admin only | Update user role |

#### PATCH /api/admin/clips Request Body

```json
{
  "status": "APPROVED",
  "reviewNotes": "Optional notes"
}
```

### Available Tags

```
FUNNY | KILL | TUCK | HIGHLIGHT | PVP | PVE | SAILING | TREASURE |
KRAKEN | EPIC_FAIL | TEAM_PLAY | SOLO
```

---

## Project Structure

```
sot-clips/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── auth/
│   │   │   │   ├── callback/route.ts    # Twitch OAuth callback
│   │   │   │   ├── login/route.ts       # Redirect to Twitch
│   │   │   │   ├── logout/route.ts      # Clear session
│   │   │   │   └── me/route.ts          # Get current user
│   │   │   ├── clips/
│   │   │   │   ├── route.ts             # GET/POST clips
│   │   │   │   └── mine/route.ts        # User's own clips
│   │   │   └── admin/
│   │   │       ├── clips/route.ts       # Admin clip management
│   │   │       ├── users/route.ts       # Admin user management
│   │   │       └── stats/route.ts       # Platform statistics
│   │   ├── admin/page.tsx               # Admin dashboard UI
│   │   ├── dashboard/page.tsx           # User dashboard UI
│   │   ├── login/page.tsx               # Login page
│   │   ├── submit/page.tsx              # Clip submission page
│   │   ├── layout.tsx                   # Root layout + providers
│   │   ├── page.tsx                     # Home / clip gallery
│   │   └── globals.css                  # Global styles + pirate theme
│   ├── components/
│   │   ├── clips/ClipCard.tsx           # Clip card with embed
│   │   ├── layout/Navbar.tsx            # Navigation bar
│   │   ├── providers/
│   │   │   ├── AuthProvider.tsx         # User auth context
│   │   │   └── QueryProvider.tsx        # React Query
│   │   └── ui/
│   │       ├── Skeletons.tsx            # Loading skeletons
│   │       └── TagBadge.tsx             # Tag badge component
│   └── lib/
│       ├── auth.ts                      # JWT + session utilities
│       ├── cors.ts                      # CORS middleware
│       ├── middleware-auth.ts           # Auth guards for routes
│       ├── prisma.ts                    # Prisma client singleton
│       └── twitch.ts                    # Twitch API utilities
├── prisma/
│   └── schema.prisma                    # Database schema
├── docs/
│   └── ADMIN_GUIDE.md                   # Admin documentation
├── .env.example
├── next.config.js
├── nixpacks.json
├── tailwind.config.js
└── README.md
```

---

## Security

### CORS
Only origins listed in `ALLOWED_ORIGINS` env var can make API requests. Configured in `next.config.js` headers and `src/lib/cors.ts`.

### Authentication
- Sessions use **HS256 JWT** signed with `JWT_SECRET`
- Tokens stored as **httpOnly** cookies (inaccessible to JavaScript)
- Sessions expire after **3 days**
- Session validity checked against database on every request

### Clip Submission Rules
1. **Must be authenticated** via Twitch
2. **Clip game must be Sea of Thieves** (verified via Twitch Helix API `game_id: 490905`)
3. **Clip creator must be registered** on the platform (prevents external spam submissions)
4. **No duplicate clips** (unique constraint on `twitchClipId`)

---

## Admin Guide

See [`docs/ADMIN_GUIDE.md`](docs/ADMIN_GUIDE.md) for detailed admin and moderation instructions.

### Quick Start for Admins

1. Log in with your Twitch account
2. Ask a database admin to run: `UPDATE users SET role = 'ADMIN' WHERE twitch_login = 'yourusername';`
3. Navigate to `/admin` in the app
4. Review pending clips, approve or decline

---

## License

MIT © Your Organization

---

*"Not all treasure is silver and gold, mate." — Jack Sparrow*
