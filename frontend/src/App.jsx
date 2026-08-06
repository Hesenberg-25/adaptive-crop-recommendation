import React, { useState, useCallback } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation, Link } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import toast from 'react-hot-toast';
import axios from 'axios';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';

import Sidebar from './components/Sidebar';
import TopBar from './components/TopBar';
import Home from './pages/Home';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';
import History from './pages/History';
import Settings from './pages/Settings';
import CatalogPage from './pages/CatalogPage';
import ErrorBoundary from './components/ErrorBoundary';

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? children : <Navigate to="/login" />;
};

const PublicRoute = ({ children }) => {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <Navigate to="/" /> : children;
};

// Inner wrapper so we can access location for public/private layout split
const AppShell = () => {
  const { isAuthenticated } = useAuth();
  const location = useLocation();

  // Location/weather state lives here so TopBar and Dashboard share it
  const [useLiveWeather, setUseLiveWeather] = useState(false);
  const [locationCoords, setLocationCoords] = useState({ lat: null, lon: null });
  const [locationName, setLocationName] = useState('');
  const [locLoading, setLocLoading] = useState(false);

  const toggleLiveWeather = useCallback(() => {
    if (!useLiveWeather) {
      if (!navigator.geolocation) {
        toast.error('Geolocation not supported');
        return;
      }
      setLocLoading(true);
      const loadToast = toast.loading('Getting location…');
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = pos.coords.latitude;
          const lon = pos.coords.longitude;
          setLocationCoords({ lat, lon });
          setUseLiveWeather(true);
          setLocLoading(false);
          toast.success('Location synced!', { id: loadToast });
          axios.get(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`)
            .then(res => {
              const addr = res.data.address || {};
              const city = addr.city || addr.town || addr.village || addr.county || '';
              const state = addr.state || addr.country || '';
              setLocationName(state ? `${city}, ${state}` : city || 'Your Location');
            })
            .catch(() => setLocationName('Your Location'));
        },
        () => {
          toast.error('Location access denied', { id: loadToast });
          setLocLoading(false);
        }
      );
    } else {
      setUseLiveWeather(false);
      setLocationCoords({ lat: null, lon: null });
      setLocationName('');
    }
  }, [useLiveWeather]);

  const isPublicPage = ['/', '/login', '/signup'].includes(location.pathname);

  return (
    <div className="min-h-screen text-farm-text-body relative">
      {/* Background */}
      <div className="fixed inset-0 z-[-1]">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1500382017468-9049fed747ef?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80')] bg-cover bg-center bg-no-repeat" />
        <div className="absolute inset-0 bg-transparent dark:bg-[#10190F]/85 transition-colors duration-500" />
        <div className="absolute inset-0 bg-[#FAF3E0]/20 dark:bg-transparent transition-colors duration-500" />
      </div>

      {/* Authenticated layout: Sidebar + TopBar */}
      {isAuthenticated && !isPublicPage && (
        <>
          <Sidebar />
          <TopBar
            useLiveWeather={useLiveWeather}
            toggleLiveWeather={toggleLiveWeather}
            locationName={locationName}
            locLoading={locLoading}
          />
        </>
      )}

      {/* Public layout: old minimal navbar */}
      {(!isAuthenticated || isPublicPage) && (
        <nav className="sticky top-4 z-50 mx-4 md:mx-auto max-w-4xl bg-white/20 dark:bg-[#1B2A17]/30 backdrop-blur-2xl border border-white/30 dark:border-white/10 shadow-[0_8px_40px_rgba(0,0,0,0.15)] rounded-[2rem] px-6 py-3 flex justify-between items-center mb-8">
          <span className="font-extrabold font-poppins text-farm-primary flex items-center gap-2 text-xl">
            🌿 AgriVision
          </span>
          <div className="flex gap-3 text-sm font-semibold">
            {isAuthenticated ? (
              <Link to="/dashboard" className="glass-button !py-1.5 !px-4 !text-sm">Go to Dashboard</Link>
            ) : (
              <>
                <Link to="/login" className="text-slate-700 dark:text-slate-300 hover:text-farm-primary transition-colors px-3 py-1.5">Login</Link>
                <Link to="/signup" className="glass-button !py-1.5 !px-4 !text-sm">Sign Up</Link>
              </>
            )}
          </div>
        </nav>
      )}

      {/* Page Content */}
      <main className={isAuthenticated && !isPublicPage ? 'pl-20 pt-32' : ''}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
          <Route path="/signup" element={<PublicRoute><Signup /></PublicRoute>} />
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <Dashboard
                externalUseLiveWeather={useLiveWeather}
                externalLocation={locationCoords}
                externalLocationName={locationName}
              />
            </ProtectedRoute>
          } />
          <Route path="/catalog" element={<ProtectedRoute><CatalogPage /></ProtectedRoute>} />
          <Route path="/history" element={<ProtectedRoute><History /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
          <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
        </Routes>
      </main>

      <Toaster position="bottom-right" />
    </div>
  );
};

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <AuthProvider>
          <BrowserRouter>
            <AppShell />
          </BrowserRouter>
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
