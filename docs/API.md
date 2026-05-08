# PlunderClips — API Reference

Base URL: `https://plunderclips.com/api`

---

## Authentication

The API uses **httpOnly cookies** for browser clients.

All protected routes require the `auth-token` cookie set automatically by the login flow, or an `Authorization: Bearer <token>` header.

Sessions last **3 days** from creation.

---

## Public Endpoints

### `GET /clips`

Returns a paginated list of approved clips.

**Query Parameters:**

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `page` | integer | 1 | Page number |
| `limit` | integer | 12 | Items per page (max: 50) |
| `sort` | `newest` \| `popular` | `newest` | Sort order |
| `tag` | string | — | Filter by tag |
| `platform` | `TWITCH` \| `YOUTUBE` \| `MEDAL` | — | Filter by platform |
| `search` | string | — | Search title / broadcaster name |

**Response:**
```json
{
  "clips": [
    {
      "id": "cm...",
      "platformClipId": "RichLuckyFly...",
      "sourceUrl": "https://clips.twitch.tv/...",
      "embedUrl": "https://clips.twitch.tv/embed?clip=...&parent=plunderclips.com",
      "title": "Epic Kraken Fight",
      "thumbnailUrl": "https://clips-media-assets2.twitch.tv/...",
      "duration": 30.0,
      "platform": "TWITCH",
      "platformVerified": true,
      "broadcasterName": "worldofchap",
      "submittedByName": "piratestreamer",
      "tags": ["KRAKEN", "PVE"],
      "viewCount": 1234,
      "createdAt": "2025-01-15T12:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 12,
    "total": 48,
    "pages": 4
  }
}
```

---

### `GET /clips/featured`

Returns the single highest-viewed approved clip from the last 7 days (falls back to all-time best).

**Response:** `{ "clip": { ...ClipDTO } | null }`

---

### `GET /clips/trending`

Returns up to 8 highest-viewed clips from the last 30 days.

**Response:** `{ "clips": [ ...ClipDTO ] }`

---

### `GET /live`

Returns all currently live streamers with eligible roles.

**Response:**
```json
{
  "streamers": [
    {
      "id": "cm...",
      "twitchLogin": "worldofchap",
      "displayName": "WorldOfChap",
      "profileImage": "https://static-cdn.jtvnw.net/...",
      "role": "PARTNER",
      "streamTitle": "SoT Saturday!",
      "streamGame": "Sea of Thieves",
      "viewerCount": 342,
      "liveUpdatedAt": "2025-05-08T14:00:00.000Z"
    }
  ]
}
```

---

### `GET /streamers`

Returns a list of all registered streamers sorted by live status → role weight → clip count.

**Response:** `{ "streamers": [ ...StreamerListItemDTO ] }`

---

### `GET /streamers/:login`

Returns a single streamer's full profile, approved clips, and stats.

**Response:**
```json
{
  "streamer": { "id": "...", "twitchLogin": "...", "displayName": "...", "role": "...", "isLive": false },
  "clips": [ ...ClipDTO ],
  "stats": { "totalClips": 12, "totalViews": 8400, "topTags": ["PVP", "FUNNY"] }
}
```

---

### `GET /auth/me`

Returns the currently authenticated user or `{ "user": null }`.

**Response (authenticated):**
```json
{
  "user": {
    "id": "cm...",
    "twitchId": "12345678",
    "twitchLogin": "piratestreamer",
    "displayName": "PirateStreamer",
    "profileImage": "https://static-cdn.jtvnw.net/...",
    "role": "USER",
    "youtubeChannelId": "UC...",
    "youtubeChannelName": "PirateStreamer YT",
    "medalUserId": null,
    "isLive": false
  }
}
```

---

## Auth Endpoints

### `GET /auth/login`

Redirects the browser to Twitch OAuth. No body required.

---

### `GET /auth/callback`

OAuth callback from Twitch. Handled server-side — do not call directly.

---

### `GET /auth/youtube/login`

Redirects the authenticated user to Google OAuth for YouTube channel linking. Sets a `yt-oauth-state` CSRF cookie.

**Requires:** active session cookie.

---

### `GET /auth/youtube/callback`

OAuth callback from Google. Handled server-side. On success redirects to `/settings?linked=youtube`. On error redirects to `/settings?error=<code>`.

---

### `GET /auth/logout`

Invalidates the current session and clears the auth cookie. Redirects to `/`.

---

## Protected Endpoints

### `POST /clips`

Submit a clip for review.

**Request Body:**
```json
{
  "clipUrl": "https://clips.twitch.tv/ClipSlug | https://youtube.com/watch?v=... | https://medal.tv/...",
  "tags": ["FUNNY", "HIGHLIGHT"]
}
```

**Validation:**
* `clipUrl`: valid Twitch clip, YouTube video, or Medal.tv clip URL
* `tags`: 1–5 items from the Tag enum

**Success (201):**
```json
{ "clip": { ...ClipDTO } }
```

**Errors:**

| Status | Reason |
|--------|--------|
| 400 | Invalid URL format |
| 401 | Not logged in |
| 403 | Broadcaster not registered on PlunderClips |
| 404 | Clip not found on platform API |
| 409 | Clip already submitted |
| 422 | Not a Sea of Thieves clip |
| 429 | Rate limit exceeded (10 clips/hour) |

---

### `GET /clips/mine`

Returns all clips submitted by the authenticated user (all statuses).

**Response:** `{ "clips": [ ...ClipDTO ] }`

---

### `GET /clips/channel`

Returns approved clips submitted by others featuring the authenticated user's channel.

**Response:** `{ "clips": [ ...ClipDTO ] }`

---

### `DELETE /clips/:id`

Deletes a clip submitted by the authenticated user.

**Response:** `{ "success": true }`

---

### `GET /progress`

Returns the authenticated user's XP and level progress.

**Response:**
```json
{
  "progress": {
    "xp": 450,
    "level": 4,
    "rank": "Cannon Fodder",
    "currentXP": 150,
    "neededXP": 400,
    "percent": 38,
    "isMaxLevel": false
  }
}
```

---

### `GET /challenges`

Returns this week's challenges with the user's progress on each.

**Response:**
```json
{
  "weekStart": "2025-05-05T00:00:00.000Z",
  "weekEnd": "2025-05-11T23:59:59.999Z",
  "challenges": [
    {
      "id": "cm...",
      "title": "Sea Legs",
      "description": "Submit 3 clips this week",
      "type": "SUBMIT_CLIPS",
      "target": 3,
      "xpReward": 75,
      "userProgress": 1,
      "completedAt": null
    }
  ]
}
```

---

### `DELETE /settings/link-youtube`

Unlinks the authenticated user's YouTube channel. Past clips are not affected.

**Response:** `{ "success": true }`

---

## Admin Endpoints (ADMIN or MODERATOR)

### `GET /admin/stats`

**Response:**
```json
{
  "stats": {
    "totalClips": 150,
    "pendingClips": 12,
    "approvedClips": 130,
    "declinedClips": 8,
    "totalUsers": 45
  },
  "recentPending": [ /* 5 most recent pending clips */ ]
}
```

---

### `GET /admin/clips`

Returns clips for moderation.

| Param | Type | Description |
|-------|------|-------------|
| `status` | `PENDING` \| `APPROVED` \| `DECLINED` | Filter by status |
| `page` | integer | Page number |
| `limit` | integer | Max 100 |

---

### `PATCH /admin/clips?id={clipId}`

Review a clip.

```json
{ "status": "APPROVED", "reviewNotes": "Optional notes" }
```

On `APPROVED`, automatically awards the submitter +50 XP and increments their `GET_APPROVED` challenge progress.

---

### `GET /admin/users`

Returns all registered users with their roles and live status.

---

### `PATCH /admin/users?id={userId}` (ADMIN only)

Update a user's permission role.

```json
{ "role": "MODERATOR" }
```

**Valid roles:** `USER`, `CONTRIBUTOR`, `SUPPORTER`, `VIP`, `VERIFIED`, `PARTNER`, `MODERATOR`, `FEATURED`, `ADMIN`

---

## Cron Endpoints (CRON_SECRET required)

All cron endpoints accept both `POST` and `GET`. They require the header:
```
Authorization: Bearer <CRON_SECRET>
```

| Endpoint | Schedule | Action |
|----------|----------|--------|
| `POST /cron/update-live` | Every 5 min | Refreshes live streamer status and viewer counts |
| `POST /cron/update-stats` | Every 6 hours | Refreshes YouTube view counts and profile images |
| `POST /cron/reset-challenges` | Weekly (Monday 00:01 UTC) | Deactivates previous week's challenges and seeds new ones |

---

## Webhook Endpoint

### `POST /webhooks/twitch`

Receives Twitch EventSub notifications. Validates HMAC signature before processing.

**Handled event types:**
* `stream.online` — sets live status, invalidates cache
* `stream.offline` — clears live status, invalidates cache
* `webhook_callback_verification` — returns challenge for subscription verification

---

## CORS

Enforced via `ALLOWED_ORIGINS` environment variable. Only listed origins may make API requests.

---

## Available Tags

`FUNNY`, `KILL`, `TUCK`, `HIGHLIGHT`, `PVP`, `PVE`, `SAILING`, `TREASURE`, `KRAKEN`, `SIREN`, `BOSS_FIGHT`, `EPIC_FAIL`, `TEAM_PLAY`, `SOLO`

---

*PlunderClips API — v2*
