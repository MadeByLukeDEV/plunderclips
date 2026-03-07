# 🚀 Deployment Guide — Coolify + Nixpacks

Step-by-step guide for deploying SoT Clips on a Coolify server.

---

## Prerequisites

- A Coolify instance (self-hosted or cloud)
- A MariaDB 10.6+ database (can be created in Coolify)
- Your Git repository (GitHub, GitLab, Gitea, etc.)
- Twitch Developer Application

---

## Step 1: Create MariaDB Database in Coolify

1. In Coolify, go to **Resources → New Resource → Database**
2. Select **MariaDB**
3. Set a strong password
4. Deploy the database
5. Note the **internal connection string** (e.g., `mysql://user:pass@mariadb-service:3306/database_name`)

---

## Step 2: Create the Application

1. Go to **Resources → New Resource → Application**
2. Connect your **Git repository**
3. Select **Nixpacks** as the build pack (or it may be auto-detected)
4. Set **Port** to `3000`

---

## Step 3: Configure Environment Variables

In the application's **Environment Variables** tab, add:

```env
# Database (use internal Coolify network address for MariaDB)
DATABASE_URL=mysql://sotclips_user:password@mariadb-service:3306/sot_clips

# Application URL (your Coolify domain)
NEXTAUTH_URL=https://sot-clips.your-domain.com
NEXT_PUBLIC_APP_URL=https://sot-clips.your-domain.com

# Secrets (generate with: openssl rand -base64 32)
NEXTAUTH_SECRET=<32+ char secret>
JWT_SECRET=<32+ char secret>

# Twitch OAuth
TWITCH_CLIENT_ID=your_twitch_client_id
TWITCH_CLIENT_SECRET=your_twitch_client_secret

# CORS (your production domain)
ALLOWED_ORIGINS=https://sot-clips.your-domain.com

# Node environment
NODE_ENV=production
```

---

## Step 4: Configure Twitch Developer Console

1. Go to [dev.twitch.tv/console/apps](https://dev.twitch.tv/console/apps)
2. Click your application → Edit
3. Add **OAuth Redirect URL**:
   ```
   https://sot-clips.your-domain.com/api/auth/callback
   ```
4. Save

---

## Step 5: Deploy

Click **Deploy** in Coolify. The Nixpacks build process will:

1. Detect Node.js from `package.json`
2. Run: `npm install && npm run db:generate && npm run build`
3. On start: `npm run db:migrate && npm start`

---

## Step 6: Create Admin User

After the first deployment:

1. Visit `https://sot-clips.your-domain.com`
2. Sign in with Twitch
3. Connect to your MariaDB and run:

```sql
UPDATE users SET role = 'ADMIN' WHERE twitch_login = 'your_twitch_username';
```

You can do this through Coolify's database terminal or Prisma Studio:
```bash
# On your server
npm run db:studio
```

---

## Nixpacks Configuration

The `nixpacks.json` at the project root controls the build:

```json
{
  "providers": ["node"],
  "buildCmd": "npm install && npm run db:generate && npm run build",
  "startCmd": "npm run db:migrate && npm start"
}
```

- **buildCmd**: Installs deps, generates Prisma types, builds Next.js
- **startCmd**: Runs Prisma migrations, starts the production server

---

## Updating the Application

Simply push to your connected Git branch. Coolify will automatically detect the push and redeploy (if auto-deploy is enabled) or you can trigger manually.

---

## Troubleshooting

### Build fails: "Can't reach database during build"
Prisma generation doesn't need a database. Make sure `DATABASE_URL` is set even during builds — it's needed for Prisma to know the provider.

### "CORS: Origin not allowed"
Ensure `ALLOWED_ORIGINS` matches your exact domain including `https://` and without trailing slash.

### Twitch callback fails
Verify that the redirect URL in Twitch dev console exactly matches `NEXTAUTH_URL + /api/auth/callback`.

### Database connection errors
Check that `DATABASE_URL` uses the **internal Coolify network address** for MariaDB, not the external IP.

---

## Health Check

You can add a health check in Coolify pointing to:
```
GET /api/auth/me
```
This will return `200` if the app is running correctly.

---

*Happy sailing! ⚓*
