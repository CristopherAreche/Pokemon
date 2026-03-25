"use client";

import axios from "axios";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

interface AdminSessionContextValue {
  isAdmin: boolean;
  isCheckingSession: boolean;
  login: (apiKey: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<void>;
}

const AdminSessionContext = createContext<AdminSessionContextValue | null>(null);

export const AdminSessionProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [isAdmin, setIsAdmin] = useState(false);
  const [isCheckingSession, setIsCheckingSession] = useState(true);

  const refreshSession = useCallback(async () => {
    try {
      const response = await axios.get<{ authenticated: boolean }>("/api/admin/session", {
        headers: {
          "Cache-Control": "no-store",
        },
      });

      setIsAdmin(Boolean(response.data.authenticated));
    } catch {
      setIsAdmin(false);
    } finally {
      setIsCheckingSession(false);
    }
  }, []);

  useEffect(() => {
    void refreshSession();
  }, [refreshSession]);

  const login = useCallback(
    async (apiKey: string) => {
      await axios.post("/api/admin/session", { apiKey });
      setIsAdmin(true);
    },
    []
  );

  const logout = useCallback(async () => {
    await axios.delete("/api/admin/session");
    setIsAdmin(false);
  }, []);

  const value = useMemo(
    () => ({
      isAdmin,
      isCheckingSession,
      login,
      logout,
      refreshSession,
    }),
    [isAdmin, isCheckingSession, login, logout, refreshSession]
  );

  return (
    <AdminSessionContext.Provider value={value}>
      {children}
    </AdminSessionContext.Provider>
  );
};

export const useAdminSession = () => {
  const context = useContext(AdminSessionContext);

  if (!context) {
    throw new Error("useAdminSession must be used within AdminSessionProvider");
  }

  return context;
};
