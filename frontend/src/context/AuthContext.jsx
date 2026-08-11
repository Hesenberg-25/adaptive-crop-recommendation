import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

const API_URL = import.meta.env.VITE_API_URL;

// How often to refresh the token (50 minutes — well before the 60-minute Supabase default expiry)
const REFRESH_INTERVAL_MS = 50 * 60 * 1000;

export const AuthProvider = ({ children }) => {
  const getInitialToken = () => {
    // Check localStorage first (persistent), then sessionStorage (legacy fallback)
    const t = localStorage.getItem('token') || sessionStorage.getItem('token');
    return (t && t !== 'null' && t !== 'undefined') ? t : null;
  };
  const getInitialRefreshToken = () => {
    const t = localStorage.getItem('refresh_token');
    return (t && t !== 'null' && t !== 'undefined') ? t : null;
  };

  const [token, setToken] = useState(getInitialToken());
  const [refreshToken, setRefreshToken] = useState(getInitialRefreshToken());
  const [user, setUser] = useState(null);
  const refreshTimerRef = useRef(null);

  // ── Refresh the token using the refresh_token ──
  const refreshSession = useCallback(async () => {
    const currentRefreshToken = localStorage.getItem('refresh_token');
    if (!currentRefreshToken) return;

    try {
      const res = await axios.post(`${API_URL}/api/auth/refresh`, {
        refresh_token: currentRefreshToken
      });

      if (res.data.token) {
        setToken(res.data.token);
        localStorage.setItem('token', res.data.token);

        if (res.data.refresh_token) {
          setRefreshToken(res.data.refresh_token);
          localStorage.setItem('refresh_token', res.data.refresh_token);
        }
        console.log('[Auth] Token refreshed successfully');
      }
    } catch (err) {
      console.error('[Auth] Token refresh failed:', err?.response?.status);
      // Only log out if refresh token is truly invalid (401), not on network errors
      if (err?.response?.status === 401) {
        console.warn('[Auth] Refresh token expired — logging out');
        setToken(null);
        setRefreshToken(null);
        localStorage.removeItem('token');
        localStorage.removeItem('refresh_token');
        sessionStorage.removeItem('token');
        setUser(null);
      }
    }
  }, []);

  // ── Start the auto-refresh interval ──
  const startRefreshTimer = useCallback(() => {
    if (refreshTimerRef.current) clearInterval(refreshTimerRef.current);
    refreshTimerRef.current = setInterval(refreshSession, REFRESH_INTERVAL_MS);
  }, [refreshSession]);

  const stopRefreshTimer = useCallback(() => {
    if (refreshTimerRef.current) {
      clearInterval(refreshTimerRef.current);
      refreshTimerRef.current = null;
    }
  }, []);

  // ── On token change: persist, fetch profile, start refresh timer ──
  useEffect(() => {
    if (token) {
      localStorage.setItem('token', token);
      // Clean up legacy sessionStorage
      sessionStorage.removeItem('token');

      // Fetch user profile
      axios.get(`${API_URL}/api/farmer/profile`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      .then(res => {
        if (res.data) setUser(res.data);
      })
      .catch(err => {
        console.error("Error fetching user profile", err);
        if (err.response && (err.response.status === 401 || err.response.status === 403)) {
          // Token expired — attempt refresh before giving up
          refreshSession();
        }
      });

      // Start auto-refresh timer
      startRefreshTimer();
    } else {
      localStorage.removeItem('token');
      localStorage.removeItem('refresh_token');
      sessionStorage.removeItem('token');
      setUser(null);
      stopRefreshTimer();
    }

    return () => stopRefreshTimer();
  }, [token, startRefreshTimer, stopRefreshTimer, refreshSession]);

  // ── On mount: if we have a token, try to refresh it immediately to validate ──
  useEffect(() => {
    const savedRefresh = localStorage.getItem('refresh_token');
    if (savedRefresh && token) {
      // Refresh immediately on app load to ensure fresh token
      refreshSession();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Also refresh on tab focus (user comes back to the tab after being away) ──
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && localStorage.getItem('refresh_token')) {
        refreshSession();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [refreshSession]);

  const login = (jwt, refresh) => {
    setToken(jwt);
    if (refresh) {
      setRefreshToken(refresh);
      localStorage.setItem('refresh_token', refresh);
    }
  };

  const logout = () => {
    setToken(null);
    setRefreshToken(null);
    localStorage.removeItem('token');
    localStorage.removeItem('refresh_token');
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('agrivision_dashboard'); // Clear dashboard state!
    stopRefreshTimer();
  };

  return (
    <AuthContext.Provider value={{ token, user, login, logout, isAuthenticated: !!token }}>
      {children}
    </AuthContext.Provider>
  );
};
