'use client';
import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

interface User {
  [x: string]: string;
  youtubeChannelId: any;
  medalUserId: any;
  id: string;
  twitchId: string;
  twitchLogin: string;
  displayName: string;
  profileImage: string;
  role: 'USER' | 'ADMIN' | 'MODERATOR';
  createdAt: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  refetch: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  refetch: () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUser = async () => {
    try {
      const res = await fetch('/api/auth/me');
      const data = await res.json();
      setUser(data.user);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUser();
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, refetch: fetchUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
