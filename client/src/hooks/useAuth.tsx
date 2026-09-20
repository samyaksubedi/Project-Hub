import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import { api } from '../api';
import {
  refreshSession,
  setAccessToken,
  setSessionLostHandler,
} from '../api/http';
import type { User } from '../types';
interface AuthContext {
  user: User | null;
  ready: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (user: User) => void;
}
const Context = createContext<AuthContext | null>(null);
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    setSessionLostHandler(() => setUser(null));
    void refreshSession()
      .then((session) => setUser(session.user))
      .catch(() => setUser(null))
      .finally(() => setReady(true));
  }, []);
  async function login(email: string, password: string) {
    const session = await api.login({ email, password });
    setAccessToken(session.accessToken);
    setUser(session.user);
  }
  async function logout() {
    await api.logout();
    setAccessToken(null);
    setUser(null);
  }
  return (
    <Context.Provider
      value={{ user, ready, login, logout, updateUser: setUser }}
    >
      {children}
    </Context.Provider>
  );
}
export function useAuth() {
  const context = useContext(Context);
  if (!context) throw new Error('AuthProvider is missing');
  return context;
}
