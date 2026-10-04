import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, onAuthStateChanged, getRedirectResult } from 'firebase/auth';
import { auth } from '../lib/firebase';

interface AuthContextType {
  currentUser: User | null;
  dbUser: any | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  currentUser: null,
  dbUser: null,
  loading: true,
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(() => auth.currentUser);
  const [dbUser, setDbUser] = useState<any | null>(null);
  const [loading, setLoading] = useState<boolean>(() => !auth.currentUser);

  useEffect(() => {
    const handleRedirect = async () => {
      try {
        const result = await getRedirectResult(auth);
        if (result && result.user) {
          console.log("Redirect success, routing to dashboard...");
          const token = await result.user.getIdToken();
          const response = await fetch('/api/user/ping', {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}` }
          });
          if (response.ok) {
            const data = await response.json();
            setDbUser(data);
          }
          if (window.location.pathname === '/' || window.location.pathname === '/login') {
            window.location.href = '/dashboard';
          }
        }
      } catch (error) {
        console.error("Redirect check error:", error);
      }
    };

    handleRedirect();

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setCurrentUser(firebaseUser);
        try {
          const token = await firebaseUser.getIdToken();
          const response = await fetch('/api/user/ping', {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}` }
          });
          if (response.ok) {
            const data = await response.json();
            setDbUser(data);
          }
        } catch (err) {
          console.error("SYNC_ERROR:", err);
        }
      } else {
        setCurrentUser(null);
        setDbUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ currentUser, dbUser, loading }}>
      {children}
    </AuthContext.Provider>
  );
};
