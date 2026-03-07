# 🛡️ Admin Guide — SoT Clips

This guide covers everything admins and moderators need to know to manage the SoT Clips platform.

---

## Roles

| Role | Access |
|------|--------|
| `USER` | Submit clips, view dashboard |
| `MODERATOR` | USER + approve/decline clips, view admin stats |
| `ADMIN` | MODERATOR + manage user roles, full access |

---

## Becoming an Admin

After your first login, a current admin or database administrator needs to run:

```sql
UPDATE users SET role = 'ADMIN' WHERE twitch_login = 'your_twitch_username';
```

Or via Prisma Studio:
```bash
npm run db:studio
```
Navigate to the `users` table, find your user, and change `role` to `ADMIN`.

---

## The Admin Dashboard (`/admin`)

Navigate to `/admin` in the browser. You'll see:

### Statistics Panel
- **Total Clips**: All clips ever submitted
- **Pending**: Awaiting review
- **Approved**: Live on the public gallery
- **Declined**: Rejected submissions
- **Users**: Total registered users

### Clip Review Tabs
- **Pending**: Clips awaiting review (action buttons visible)
- **Approved**: All approved clips
- **Declined**: All declined clips

### Reviewing a Clip
1. Click the thumbnail to open the original Twitch clip in a new tab
2. Verify it's a legitimate Sea of Thieves clip with good content
3. Click **Approve** (green) or **Decline** (red)
4. The clip moves to the appropriate tab immediately

---

## Clip Submission Rules (Auto-enforced)

The platform automatically enforces these rules — you don't need to manually check them:

| Rule | How it's enforced |
|------|------------------|
| Must be Sea of Thieves | Twitch API `game_id` check (id: `490905`) |
| Clip creator must be registered | Database lookup by Twitch username |
| No duplicates | Unique constraint on `twitchClipId` |
| Must be a valid Twitch clip URL | URL parsing + Twitch API fetch |

### What to manually check when reviewing:
- Content isn't offensive, hateful, or against the platform's spirit
- Clip quality meets community standards
- Tags are appropriate

---

## Managing Users

### Via Admin API

**List all users:**
```bash
GET /api/admin/users
Authorization: (your auth cookie)
```

**Change a user's role:**
```bash
PATCH /api/admin/users?id=USER_ID
Content-Type: application/json

{"role": "MODERATOR"}
```

Valid roles: `USER`, `MODERATOR`, `ADMIN`

### Via Prisma Studio (Database)
```bash
npm run db:studio
```
Open the `users` table, click a user, and edit their `role` field.

---

## API Authentication

All admin API endpoints require:
1. An `auth-token` cookie (set automatically on login), OR
2. An `Authorization: Bearer <token>` header

The token must belong to a user with `ADMIN` or `MODERATOR` role.

---

## Moderation Checklist

When reviewing a pending clip, ask yourself:

- [ ] Is it a Sea of Thieves clip? (auto-checked, but verify)
- [ ] Is the content appropriate?
- [ ] Is the clip quality good enough to be featured?
- [ ] Are the tags accurate?
- [ ] Is there any offensive content, hate speech, or harassment visible?

If yes to all positive points → **Approve**
If any concern → **Decline**

---

## Database Maintenance

### Clean up expired sessions (run periodically)
```sql
DELETE FROM sessions WHERE expires_at < NOW();
```

### View pending clips older than 7 days
```sql
SELECT * FROM clips 
WHERE status = 'PENDING' 
AND created_at < DATE_SUB(NOW(), INTERVAL 7 DAY);
```

### Top submitters
```sql
SELECT u.display_name, COUNT(c.id) as clip_count 
FROM users u 
JOIN clips c ON c.submitted_by = u.id 
WHERE c.status = 'APPROVED'
GROUP BY u.id 
ORDER BY clip_count DESC 
LIMIT 10;
```

---

## Troubleshooting

### Clip shows "not Sea of Thieves" but it is
The Twitch API checks `game_id` at submission time. If the streamer forgot to set their game to Sea of Thieves before clipping, it will be rejected. The submitter should ensure the clip was created while the game was set to Sea of Thieves on Twitch.

### Clip creator "not registered" error
The Twitch user who **created** the clip (the clipping user, not the broadcaster) must be registered on SoT Clips. The submitter needs to log in to the platform first.

### Session expired
JWT sessions last 3 days. Users will need to log in again. Sessions are also stored in the `sessions` table — you can extend or delete them from there.

---

*"Every crew needs a good captain." — The Pirate Code*
