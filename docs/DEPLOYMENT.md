# PlunderClips — Deployment Guide (Coolify + Nixpacks)

---

## Prerequisites

- Coolify instance (self-hosted or cloud)
- MariaDB 10.6+ (created in Coolify)
- Redis (created in Coolify — use standard Redis, not Dragonfly)
- Git repository connected to Coolify
- Twitch Developer Application
- Google Cloud project with YouTube Data API v3 enabled

---

## Step 1: Create MariaDB in Coolify

1. Resources → New Resource → Database → **MariaDB**
2. Set a strong password, deploy
3. Note the **internal** connection string: `mysql://user:pass@mariadb-service:3306/plunderclips`
4. Create two database users:
   - `plunderclips_app` — DML only (SELECT, INSERT, UPDATE, DELETE)
   - `plunderclips_migrate` — full DDL (for Prisma migrations)

---

## Step 2: Create Redis in Coolify

1. Resources → New Resource → Database → **Redis**
2. Deploy and note the connection string
3. The app expects `redis://:password@host:port/0` format — Coolify may include a username in the URL; the app automatically strips it

---

## Step 3: Create the Application

1. Resources → New Resource → Application
2. Connect your Git repository, select the `main` branch (production)
3. Build pack: **Nixpacks** (auto-detected)
4. Port: `3000`

---

## Step 4: Environment Variables

In the application's Environment Variables tab:

```env
# ── Database ────────────────────────────────────────────────────────────────
DATABASE_URL=mysql://plunderclips_app:password@mariadb-service:3306/plunderclips
MIGRATE_DATABASE_URL=mysql://plunderclips_migrate:password@mariadb-service:3306/plunderclips

# ── Redis ───────────────────────────────────────────────────────────────────
REDIS_URL=redis://:password@redis-service:6379/0

# ── Application URLs ────────────────────────────────────────────────────────
NEXTAUTH_URL=https://plunderclips.com
NEXT_PUBLIC_APP_URL=https://plunderclips.com
NEXT_PUBLIC_APP_NAME=PlunderClips

# ── Secrets (generate with: openssl rand -hex 32) ───────────────────────────
JWT_SECRET=<64-char hex>
CRON_SECRET=<64-char hex>

# ── Twitch OAuth ─────────────────────────────────────────────────────────────
TWITCH_CLIENT_ID=your_twitch_client_id
TWITCH_CLIENT_SECRET=your_twitch_client_secret
TWITCH_WEBHOOK_SECRET=<64-char hex>

# ── Google / YouTube ─────────────────────────────────────────────────────────
YOUTUBE_API_KEY=your_youtube_data_api_v3_key
GOOGLE_CLIENT_ID=your_google_oauth_client_id
GOOGLE_CLIENT_SECRET=your_google_oauth_client_secret
GOOGLE_VERIFICATION_ID=your_search_console_verification_id

# ── CORS ─────────────────────────────────────────────────────────────────────
ALLOWED_ORIGINS=https://plunderclips.com,https://www.plunderclips.com

# ── Misc ─────────────────────────────────────────────────────────────────────
NODE_ENV=production
ALLOW_MANUAL_LIVE_OVERRIDE=false
NIXPACKS_NODE_VERSION=22
```

---

## Step 5: Configure Twitch Developer Console

1. Go to [dev.twitch.tv/console/apps](https://dev.twitch.tv/console/apps) → your app → Edit
2. Add OAuth Redirect URL:
   ```
   https://plunderclips.com/api/auth/callback
   ```
3. Save

---

## Step 6: Configure Google Cloud (YouTube OAuth)

1. Go to [console.cloud.google.com](https://console.cloud.google.com)
2. Enable **YouTube Data API v3**
3. Create **OAuth 2.0 Client ID** (Web application type)
4. Add Authorised redirect URI:
   ```
   https://plunderclips.com/api/auth/youtube/callback
   ```
5. Copy Client ID and Secret into env vars

---

## Step 7: Deploy

Click **Deploy** in Coolify. The Nixpacks build process runs:

1. `npm install && npm run db:generate && npm run build`
2. On start: `npm run db:migrate && npm start`

---

## Step 8: Create Admin User

After first deploy:
1. Sign in at `https://plunderclips.com` with your Twitch account
2. Open Coolify's database terminal or run Prisma Studio (`npm run db:studio`) and execute:

```sql
UPDATE users SET role = 'ADMIN' WHERE twitch_login = 'your_twitch_username';
```

---

## Step 9: Set Up Cron Jobs

Configure these in Coolify (or an external scheduler like cron-job.org):

| Endpoint | Schedule | Purpose |
|----------|----------|---------|
| `POST /api/cron/update-live` | Every 5 minutes | Refresh live streamer status |
| `POST /api/cron/update-stats` | Every 6 hours | Refresh YouTube views + profile images |
| `POST /api/cron/reset-challenges` | Weekly (Monday 00:01 UTC) | Reset weekly challenges |

All cron requests require the header:
```
Authorization: Bearer <CRON_SECRET>
```

---

## Nixpacks Configuration

`nixpacks.json` at project root:

```json
{
  "providers": ["node"],
  "buildCmd": "npm install && npm run db:generate && npm run build",
  "startCmd": "npm run db:migrate && npm start"
}
```

---

## Updating the Application

Push to the connected Git branch. Coolify auto-deploys on push (if enabled) or trigger manually.

---

## Health Check

Point Coolify's health check to:
```
GET /api/auth/me
```
Returns `200` when the app is running. Returns `401` if Redis/DB issues prevent a valid session but the app itself is up — that's acceptable for a health check.

---

## Troubleshooting

### `WRONGPASS` on Redis connection
Coolify generates URLs with a service name as the username (e.g. `redis://plunderclips:pass@host`). The app strips the username automatically — no manual action needed.

### "Can't reach database during build"
Prisma generation (`db:generate`) doesn't need a live database. Ensure `DATABASE_URL` is set in build env even if the DB isn't accessible during build time.

### "CORS: Origin not allowed"
`ALLOWED_ORIGINS` must exactly match the requesting origin including `https://` and no trailing slash.

### Twitch OAuth callback fails
The redirect URI in the Twitch dev console must exactly match `NEXTAUTH_URL + /api/auth/callback`.

### YouTube OAuth callback fails
The redirect URI in Google Cloud Console must exactly match `NEXTAUTH_URL + /api/auth/youtube/callback`.

### Database connection errors
Use the **internal Coolify network address** for MariaDB — not the external IP.

### Weekly challenges not appearing
Challenges are auto-seeded on the first `/api/challenges` request of each week. If the reset cron didn't run, the first user to open their dashboard will trigger seeding automatically.

---

*Happy sailing. ⚓*
