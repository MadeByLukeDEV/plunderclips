# PlunderClips — Admin Guide

This guide covers everything admins and moderators need to know to manage PlunderClips.

---

## Role System

### Permission Roles

| Role | Badge | Access |
|------|-------|--------|
| `USER` | CREW | Submit clips, view dashboard |
| `CONTRIBUTOR` | CREW+ | Active submitter badge |
| `SUPPORTER` | SUPPORTER | Supporter badge |
| `VIP` | VIP | VIP badge, live section visibility |
| `VERIFIED` | VERIFIED | Verified streamer badge, live section |
| `PARTNER` | PARTNER | Official partner badge, live section |
| `MODERATOR` | MOD | All USER rights + approve/decline clips, admin panel |
| `FEATURED` | LEGEND | Hand-picked featured creator, live section |
| `ADMIN` | CAPTAIN | Full access — role management, all admin functions |

> **Note:** These are **permission roles** that control access. They are separate from the **XP ranks** (Bilge Rat, Kraken Bait, etc.) which are cosmetic titles based on activity.

### Live Section Visibility

Only users with these roles appear in the live streamers section:
`ADMIN`, `FEATURED`, `PARTNER`, `VERIFIED`, `VIP`

---

## Becoming an Admin

After your first login, a current admin must promote you via the admin panel, or run:

```sql
UPDATE users SET role = 'ADMIN' WHERE twitch_login = 'your_twitch_username';
```

Or via Prisma Studio:
```bash
npm run db:studio
```
Navigate to the `users` table and change the `role` field.

---

## The Admin Panel (`/admin`)

### Statistics Panel
- **Total / Pending / Approved / Declined** clips
- **Total registered users**
- Recent pending clips for quick review

### Clip Review

1. Open a pending clip
2. Watch it (embedded player) or click through to the source
3. Verify it's genuine Sea of Thieves content
4. Click **Approve** or **Decline**

On approval, the system automatically:
- Awards the submitter **+50 XP**
- Increments their `GET_APPROVED` weekly challenge progress
- Invalidates relevant Redis cache keys

---

## Clip Submission Rules

### Auto-enforced

| Rule | Enforcement |
|------|-------------|
| Must be Sea of Thieves content | Twitch `game_id` check; YouTube title/description/tag search |
| Broadcaster must be registered | DB lookup by Twitch login or YouTube channel ID |
| No duplicates | Unique constraint on `platformClipId` |
| Valid URL format | Platform-specific URL parsing before API call |
| Rate limit | Max 10 clips per hour per user |

### Manually check when reviewing

- Content isn't offensive, hateful, or against community values
- Tags are accurate and appropriate
- Clip has reasonable quality (not completely broken/unviewable)
- For Medal.tv clips: game content is visible (no API verification possible)

### Platform-specific notes

**Twitch clips:** `platformVerified = true` — submitter ownership auto-confirmed.

**YouTube clips:** `platformVerified = true` only if the submitter's linked YouTube channel matches the video's channel. Otherwise flagged with a review note. Check the review notes field when moderating.

**Medal.tv clips:** Always `platformVerified = false`. Always requires manual review. The review note will say "Manual review required."

---

## Managing Users

### Via Admin Panel

Navigate to `/admin/users`. You can:
- View all registered users, their roles, XP level, and live status
- Change any user's role (ADMIN only)

### Via API

```bash
# List all users
GET /api/admin/users

# Change role
PATCH /api/admin/users?id=USER_ID
Content-Type: application/json
{"role": "MODERATOR"}
```

### Via Prisma Studio

```bash
npm run db:studio
```

---

## XP & Challenges System

### How XP Works

Users earn XP automatically:
- **+15 XP** when they submit a clip
- **+50 XP** when one of their clips is approved
- **+75–150 XP** when they complete a weekly challenge

XP determines a user's **rank** (cosmetic title only — does not affect permissions):
Level 1 "Shipwrecked Newcomer" through Level 20 "THE KRAKEN ITSELF".

### Weekly Challenges

Three challenges reset every Monday at midnight UTC:
1. **Sea Legs** — Submit 3 clips → +75 XP
2. **Seal of Approval** — Get 2 clips approved → +100 XP
3. **View Hungry** — Earn 250 views on approved clips → +150 XP

Challenges auto-seed on the first `/api/challenges` request of the week as a fallback if the cron hasn't run.

### Cron Jobs

| Job | Schedule | Route |
|-----|----------|-------|
| Update live status | Every 5 min | `POST /api/cron/update-live` |
| Refresh view counts + profile images | Every 6 hours | `POST /api/cron/update-stats` |
| Reset weekly challenges | Monday 00:01 UTC | `POST /api/cron/reset-challenges` |

All require `Authorization: Bearer <CRON_SECRET>`.

---

## API Authentication

All admin endpoints require:
- `auth-token` cookie (set on login), OR
- `Authorization: Bearer <token>` header

The session must belong to a user with `ADMIN` or `MODERATOR` role.

---

## Moderation Checklist

When reviewing a pending clip:

- [ ] Is it a Sea of Thieves clip? (auto-checked for Twitch, manual for YouTube/Medal)
- [ ] Is the content appropriate (no hate speech, harassment, real-world violence)?
- [ ] Does the clip have a reasonable quality level?
- [ ] Are the submitted tags accurate?
- [ ] If YouTube: check `platformVerified` in the review notes — is ownership confirmed?
- [ ] If Medal.tv: verify game is visible in the clip

Approve if all checks pass. Decline with a note if not.

---

## Database Maintenance

### Clean up expired sessions
```sql
DELETE FROM sessions WHERE expires_at < NOW();
```

### View clips pending review for more than 7 days
```sql
SELECT c.id, c.title, c.broadcaster_name, c.created_at
FROM clips c
JOIN clip_moderation m ON m.clip_id = c.id
WHERE m.status = 'PENDING'
AND c.created_at < DATE_SUB(NOW(), INTERVAL 7 DAY)
ORDER BY c.created_at ASC;
```

### Top clip submitters (approved clips)
```sql
SELECT u.display_name, COUNT(c.id) AS approved
FROM users u
JOIN clips c ON c.submitted_by = u.id
JOIN clip_moderation m ON m.clip_id = c.id
WHERE m.status = 'APPROVED'
GROUP BY u.id
ORDER BY approved DESC
LIMIT 10;
```

### Top XP earners
```sql
SELECT u.display_name, u.role, p.xp, p.level, p.class
FROM users u
JOIN user_progress p ON p.user_id = u.id
ORDER BY p.xp DESC
LIMIT 10;
```

### Active weekly challenges
```sql
SELECT title, description, type, target, xp_reward, week_start, week_end
FROM challenges
WHERE active = 1
ORDER BY week_start DESC;
```

---

## Troubleshooting

### "Not a Sea of Thieves clip" rejection for a real SoT clip
For Twitch: the streamer didn't set their game to Sea of Thieves before clipping. Nothing can be done — the clip metadata from Twitch doesn't match. Ask the submitter to create a new clip with the correct game set.

For YouTube: the title, description, and tags must mention "Sea of Thieves". If the video doesn't include that text, it will be rejected.

### "Broadcaster not registered" error
For Twitch clips: the broadcaster must have a PlunderClips account. They need to sign in at plunderclips.com first.

For YouTube clips: the broadcaster must link their YouTube channel in Settings → YouTube.

### Session expired
JWT sessions last 3 days. Users re-login automatically on next visit. To forcibly expire a session, delete the row from the `sessions` table:
```sql
DELETE FROM sessions WHERE user_id = 'cm...';
```

### Redis cache stale after manual DB change
If you manually update a user role or clip status in the database, manually bust the relevant cache. Connect to Redis and run:
```
DEL streamers:all
DEL streamer:twitchlogin
```

Or simply wait for the next cron run to invalidate naturally.

---

*"Every crew needs a good captain." — The Pirate Code*
