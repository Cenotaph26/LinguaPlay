import { useEffect } from 'react';
import { useAuthStore } from '../stores/authStore';
import { authApi } from '../services/api';

export function useAuth() {
  const { token, user, setUser } = useAuthStore();

  useEffect(() => {
    if (token && !user) {
      authApi.me()
        .then((res) => setUser(res.data))
        .catch(() => {});
    }
  }, [token]);

  return { token, user, isAuthenticated: !!token };
}
