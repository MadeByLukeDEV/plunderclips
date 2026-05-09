// src/modules/auth/auth.types.ts

export interface JWTPayload {
  userId:      string;
  twitchId:    string;
  twitchLogin: string;
  displayName: string;
  role:        string;
  sessionId:   string;
}

export interface SessionResult {
  session: {
    id:        string;
    userId:    string;
    token:     string;
    expiresAt: Date;
    createdAt: Date;
  };
  user: AuthUser;
  payload: JWTPayload;
}

// Minimal user shape returned from validateSession
// Only what auth middleware needs — avoids pulling full user on every request
export interface AuthUser {
  id:           string;
  twitchId:     string;
  twitchLogin:  string;
  displayName:  string;
  profileImage: string | null;
  role:         string;
}
