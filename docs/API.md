# 📡 SoT Clips — API Documentation

Base URL: `https://your-domain.com/api`

---

## Authentication

The API uses **httpOnly cookies** for browser clients and **Bearer tokens** for programmatic access.

All protected routes require:
- Cookie: `auth-token=<jwt_token>` (set automatically by login flow), OR  
- Header: `Authorization: Bearer <jwt_token>`

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
| `tag` | string | — | Filter by tag enum |
| `search` | string | — | Search title/broadcaster |

**Available Tags:**
`FUNNY`, `KILL`, `TUCK`, `HIGHLIGHT`, `PVP`, `PVE`, `SAILING`, `TREASURE`, `KRAKEN`, `SIREN`, `BOSS_FIGHT`, `EPIC_FAIL`, `TEAM_PLAY`, `SOLO`

**Response:**
```json
{
  "clips": [
    {
      "id": "cluid123",
      "twitchClipId": "RichLuckyFlyTBC...",
      "twitchUrl": "https://www.twitch.tv/user/clip/...",
      "embedUrl": "https://clips.twitch.tv/embed?clip=...&parent=your-domain.com",
      "title": "Epic Kraken Fight",
      "thumbnailUrl": "https://clips-media-assets2.twitch.tv/...",
      "viewCount": 1234,
      "duration": 30.0,
      "submittedByName": "PirateStreamer",
      "broadcasterName": "WorldOfChap",
      "status": "APPROVED",
      "tags": [
        { "id": "tag123", "clipId": "cluid123", "tag": "KRAKEN" }
      ],
      "createdAt": "2024-01-15T12:00:00.000Z"
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

### `GET /auth/me`

Returns the currently authenticated user or `{ user: null }` if not logged in.

**Response (authenticated):**
```json
{
  "user": {
    "id": "cluid456",
    "twitchId": "12345678",
    "twitchLogin": "piratestreamer",
    "displayName": "PirateStreamer",
    "profileImage": "https://static-cdn.jtvnw.net/...",
    "role": "USER",
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

---

## Protected Endpoints (Requires Login)

### `POST /clips`

Submit a new clip for review.

**Request Body:**
```json
{
  "twitchUrl": "https://www.twitch.tv/username/clip/ClipSlug-abc123",
  "tags": ["FUNNY", "HIGHLIGHT"]
}
```

**Validation Rules:**
- `twitchUrl`: Valid Twitch clip URL
- `tags`: Array of 1–5 valid Tag enums

**Success Response (201):**
```json
{
  "clip": { ... },
  "message": "Clip submitted successfully! It will be reviewed shortly."
}
```

**Error Responses:**

| Status | Error | Reason |
|--------|-------|--------|
| 400 | `Invalid Twitch clip URL` | URL format doesn't match Twitch pattern |
| 401 | `Unauthorized` | Not logged in |
| 403 | `Creator not registered` | Clip creator isn't a registered user |
| 404 | `Could not fetch clip from Twitch` | Clip doesn't exist or is private |
| 409 | `Clip already submitted` | Duplicate clip |
| 422 | `Not a Sea of Thieves clip` | Wrong game detected by Twitch API |

---

### `GET /clips/mine`

Returns all clips submitted by the authenticated user (all statuses).

**Response:**
```json
{
  "clips": [ /* Same clip structure, includes PENDING and DECLINED */ ]
}
```

---

## Admin Endpoints (Requires ADMIN or MODERATOR Role)

### `GET /admin/stats`

Returns platform-wide statistics.

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

Returns clips with filtering. All statuses visible.

**Query Parameters:**

| Param | Type | Description |
|-------|------|-------------|
| `status` | string | Filter: `PENDING`, `APPROVED`, `DECLINED` |
| `page` | integer | Page number |
| `limit` | integer | Items per page (max: 100) |

---

### `PATCH /admin/clips?id={clipId}`

Approve or decline a clip.

**Request Body:**
```json
{
  "status": "APPROVED",
  "reviewNotes": "Optional moderator notes"
}
```

**Valid statuses:** `PENDING`, `APPROVED`, `DECLINED`

---

### `GET /admin/users`

Returns all registered users.

---

### `PATCH /admin/users?id={userId}` (ADMIN only)

Update a user's role.

**Request Body:**
```json
{
  "role": "MODERATOR"
}
```

**Valid roles:** `USER`, `MODERATOR`, `ADMIN`

---

## Auth Flow

```
User clicks "Sign in with Twitch"
  → GET /api/auth/login
  → Redirect to Twitch OAuth
  → User authorizes
  → Twitch redirects to GET /api/auth/callback?code=...
  → Server exchanges code for token
  → Server fetches Twitch user info
  → Server upserts user in DB
  → Server creates JWT session (3 days)
  → Server sets httpOnly cookie
  → Redirect to /dashboard
```

---

## CORS

The API enforces CORS based on the `ALLOWED_ORIGINS` environment variable. Only listed origins can make API requests. The Twitch OAuth flow uses server-side redirects and is not affected by CORS.

---

*API version 1.0.0 — SoT Clips*
