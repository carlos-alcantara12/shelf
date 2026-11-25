import { createContext, useCallback, useContext, useMemo, useSyncExternalStore } from "react";
import {
  clearSession,
  getAccessToken,
  getStoredUsername,
  registerAccount,
  requestTokens,
  saveSession,
  subscribeSession,
} from "@/lib/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  // A sessão vive no localStorage; `subscribeSession` avisa quando ela muda
  // (entrada, saída ou renovação do token).
  const accessToken = useSyncExternalStore(subscribeSession, getAccessToken, () => "");
  const username = useSyncExternalStore(subscribeSession, getStoredUsername, () => "");

  const signIn = useCallback(async ({ username: name, email, password, register = false }) => {
    if (register) await registerAccount({ username: name, email, password });
    const tokens = await requestTokens({ username: name, password });
    saveSession({ access: tokens.access, refresh: tokens.refresh, username: name });
  }, []);

  const signOut = useCallback(() => clearSession(), []);

  const value = useMemo(
    () => ({ accessToken, username, isAuthenticated: Boolean(accessToken), signIn, signOut }),
    [accessToken, username, signIn, signOut],
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth precisa estar dentro de <AuthProvider>.");
  return context;
}
