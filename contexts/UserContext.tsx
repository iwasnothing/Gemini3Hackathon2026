'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '@/lib/types';

interface UserContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  isAuthenticated: boolean;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

// Mock users for demonstration
const MOCK_USERS: User[] = [
  { id: 'user-1', email: 'admin@example.com', name: 'Admin User', role: 'admin' },
  { id: 'user-2', email: 'analyst@example.com', name: 'Analyst User', role: 'analyst' },
  { id: 'user-3', email: 'viewer@example.com', name: 'Viewer User', role: 'viewer' },
];

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    // Check for stored user session
    const storedUser = localStorage.getItem('currentUser');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        localStorage.removeItem('currentUser');
      }
    } else {
      // Default to first user for demo purposes
      setUser(MOCK_USERS[0]);
      localStorage.setItem('currentUser', JSON.stringify(MOCK_USERS[0]));
    }
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    // Mock authentication - in real app, this would call an API
    const foundUser = MOCK_USERS.find((u) => u.email === email);
    if (foundUser) {
      setUser(foundUser);
      localStorage.setItem('currentUser', JSON.stringify(foundUser));
      return true;
    }
    return false;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('currentUser');
  };

  return (
    <UserContext.Provider
      value={{
        user,
        login,
        logout,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}
