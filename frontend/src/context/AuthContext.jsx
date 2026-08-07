import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const getInitialToken = () => {
    const t = sessionStorage.getItem('token');
    return (t && t !== 'null' && t !== 'undefined') ? t : null;
  };
  const [token, setToken] = useState(getInitialToken());
  const [user, setUser] = useState(null);

  useEffect(() => {
    if (token) {
      sessionStorage.setItem('token', token);
      axios.get(`${import.meta.env.VITE_API_URL}/api/farmer/profile`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      .then(res => {
        if (res.data) setUser(res.data);
      })
      .catch(err => {
        console.error("Error fetching user profile", err);
        if (err.response && (err.response.status === 401 || err.response.status === 403)) {
          setToken(null);
          sessionStorage.removeItem('token');
          setUser(null);
        }
      });
    } else {
      sessionStorage.removeItem('token');
      setUser(null);
    }
  }, [token]);

  const login = (jwt) => {
    setToken(jwt);
  };

  const logout = () => {
    setToken(null);
    sessionStorage.removeItem('token');
  };

  return (
    <AuthContext.Provider value={{ token, user, login, logout, isAuthenticated: !!token }}>
      {children}
    </AuthContext.Provider>
  );
};
