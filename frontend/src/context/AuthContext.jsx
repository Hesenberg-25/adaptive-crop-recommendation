import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(localStorage.getItem('token') || null);
  const [user, setUser] = useState(null); // Could decode JWT or fetch user details here

  useEffect(() => {
    if (token) {
      localStorage.setItem('token', token);
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
          localStorage.removeItem('token');
          setUser(null);
        }
      });
    } else {
      localStorage.removeItem('token');
      setUser(null);
    }
  }, [token]);

  const login = (jwt) => {
    setToken(jwt);
  };

  const logout = () => {
    setToken(null);
  };

  return (
    <AuthContext.Provider value={{ token, user, login, logout, isAuthenticated: !!token }}>
      {children}
    </AuthContext.Provider>
  );
};
