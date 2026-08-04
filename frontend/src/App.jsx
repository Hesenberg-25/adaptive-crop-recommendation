import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';

import Navbar from './components/Navbar';
import Home from './pages/Home';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';
import History from './pages/History';

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? children : <Navigate to="/login" />;
};

const PublicRoute = ({ children }) => {
  const { isAuthenticated } = useAuth();
  // If user is already authenticated, don't let them sit on login/signup/home
  return isAuthenticated ? <Navigate to="/dashboard" /> : children;
};

import ErrorBoundary from './components/ErrorBoundary';

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <AuthProvider>
          <BrowserRouter>
            <div className="min-h-screen text-farm-text-body relative">
              {/* Background Layer */}
              <div className="fixed inset-0 z-[-1] transition-all duration-500">
                 {/* Full-bleed golden hour farmland photo */}
                 <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1500382017468-9049fed747ef?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80')] bg-cover bg-center bg-no-repeat transition-all duration-500"></div>
                 {/* Dark mode overlay: dusk/night tint */}
                 <div className="absolute inset-0 bg-transparent dark:bg-[#10190F]/85 transition-colors duration-500"></div>
                 {/* Light mode overlay: very faint cream tint */}
                 <div className="absolute inset-0 bg-[#FAF3E0]/20 dark:bg-transparent transition-colors duration-500"></div>
              </div>
              <Navbar />
              <Routes>
                {/* Public Routes - Auto-redirect to dashboard if logged in */}
                <Route path="/" element={<PublicRoute><Home /></PublicRoute>} />
                <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
                <Route path="/signup" element={<PublicRoute><Signup /></PublicRoute>} />
                
                {/* Protected Routes - Auto-redirect to login if not logged in */}
                <Route 
                  path="/dashboard" 
                  element={
                    <ProtectedRoute>
                      <Dashboard />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/profile" 
                  element={
                    <ProtectedRoute>
                      <Profile />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/history" 
                  element={
                    <ProtectedRoute>
                      <History />
                    </ProtectedRoute>
                  } 
                />
              </Routes>
              <Toaster position="bottom-right" />
            </div>
          </BrowserRouter>
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
