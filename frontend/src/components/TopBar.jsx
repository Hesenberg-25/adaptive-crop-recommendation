import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Sun, Moon, Bell, User as UserIcon, LogOut, MapPin, Loader2, Leaf, Calendar } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { motion, AnimatePresence } from 'framer-motion';

const TopBar = ({ useLiveWeather, toggleLiveWeather, locationName, locLoading }) => {
  const [showNotifs, setShowNotifs] = useState(false);
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const handleLogout = () => { logout(); navigate('/login'); };

  const todayStr = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' });

  // Mocked notifications
  const notifications = [
    { id: 1, title: 'Welcome!', text: 'Welcome to AgriVision. Complete your profile for better AI predictions.', time: 'Just now' },
    { id: 2, title: 'System Update', text: 'Live weather syncing is now available for your region.', time: '2 hrs ago' }
  ];

  return (
    <motion.header
      initial={{ y: -60, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 120, damping: 20 }}
      className="fixed top-3 left-20 right-3 z-40 flex items-center justify-between gap-3
                 bg-white/20 dark:bg-[#1B2A17]/30 backdrop-blur-2xl
                 border border-white/30 dark:border-white/10
                 shadow-[0_8px_40px_rgba(0,0,0,0.15)] dark:shadow-[0_8px_40px_rgba(0,0,0,0.4)]
                 rounded-[1.5rem] px-5 py-3"
    >
      {/* Left — Brand & Date */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 text-farm-primary dark:text-farm-text-heading font-extrabold font-poppins text-lg select-none">
          <Leaf className="w-5 h-5 text-farm-primary" />
          AgriVision
        </div>
        <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/40 dark:bg-black/20 border border-white/40 dark:border-white/5 text-xs font-semibold text-slate-600 dark:text-slate-300">
          <Calendar className="w-3.5 h-3.5" />
          {todayStr}
        </div>
      </div>

      {/* Right — Actions & Location */}
      <div className="flex items-center gap-3">
        {/* Location toggle (only shown when authenticated) */}
        {useLiveWeather !== undefined && (
          <div className="hidden md:flex items-center gap-3 bg-white/30 dark:bg-white/5 border border-white/30 dark:border-white/10 rounded-2xl px-4 py-1.5 mr-2">
            <MapPin className="w-4 h-4 text-farm-accent-gold flex-shrink-0" />
            <div className="flex flex-col">
              <span className="text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400 leading-none">Live Location</span>
              <AnimatePresence mode="wait">
                {useLiveWeather && locationName ? (
                  <motion.span
                    key="loc"
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 4 }}
                    className="text-xs font-semibold text-slate-800 dark:text-white"
                  >
                    {locationName}
                  </motion.span>
                ) : locLoading ? (
                  <motion.span key="loading" className="text-xs text-slate-400 flex items-center gap-1">
                    <Loader2 className="w-3 h-3 animate-spin" /> Fetching…
                  </motion.span>
                ) : (
                  <motion.span key="off" className="text-xs text-slate-400">Off</motion.span>
                )}
              </AnimatePresence>
            </div>
            {/* Toggle switch */}
            <label className="relative inline-flex items-center cursor-pointer ml-1">
              <input type="checkbox" className="sr-only peer" checked={!!useLiveWeather} onChange={toggleLiveWeather} />
              <div className="w-10 h-5 bg-white/20 peer-focus:outline-none rounded-full peer
                              peer-checked:after:translate-x-full peer-checked:after:border-white
                              after:content-[''] after:absolute after:top-[2px] after:left-[2px]
                              after:bg-white after:border-white after:border after:rounded-full
                              after:h-4 after:w-4 after:transition-all
                              peer-checked:bg-farm-primary dark:peer-checked:bg-farm-accent-gold" />
            </label>
          </div>
        )}
        {/* Theme Toggle */}
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={toggleTheme}
          className="w-9 h-9 rounded-2xl flex items-center justify-center bg-white/30 dark:bg-white/10 border border-white/30 dark:border-white/10 hover:bg-white/50 dark:hover:bg-white/20 transition-all"
        >
          {theme === 'dark'
            ? <Sun className="w-4 h-4 text-amber-400" />
            : <Moon className="w-4 h-4 text-slate-600" />
          }
        </motion.button>

        {/* Notifications */}
        <div className="relative">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setShowNotifs(!showNotifs)}
            className="relative w-9 h-9 rounded-2xl flex items-center justify-center bg-white/30 dark:bg-white/10 border border-white/30 dark:border-white/10 hover:bg-white/50 dark:hover:bg-white/20 transition-all"
          >
            <Bell className="w-4 h-4 text-slate-600 dark:text-slate-300" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border border-white dark:border-[#10190F]" />
          </motion.button>
          
          <AnimatePresence>
            {showNotifs && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                className="absolute top-12 right-0 w-80 glass-panel !p-4 flex flex-col gap-3 shadow-2xl origin-top-right z-50"
              >
                <div className="flex justify-between items-center mb-1">
                  <h3 className="font-bold text-slate-800 dark:text-white">Notifications</h3>
                  <span className="text-xs bg-farm-primary/10 text-farm-primary px-2 rounded-full font-bold">New</span>
                </div>
                {notifications.map(n => (
                  <div key={n.id} className="p-3 bg-white/40 dark:bg-white/5 rounded-xl border border-white/20 dark:border-white/5">
                    <div className="flex justify-between items-start mb-1">
                      <span className="font-semibold text-sm text-slate-800 dark:text-white">{n.title}</span>
                      <span className="text-[10px] text-slate-500">{n.time}</span>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-400">{n.text}</p>
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Profile */}
        <Link to="/profile">
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="flex items-center gap-2 bg-white/30 dark:bg-white/10 border border-white/30 dark:border-white/10 rounded-2xl px-3 py-1.5 cursor-pointer hover:bg-white/50 dark:hover:bg-white/20 transition-all"
          >
            <div className="w-7 h-7 rounded-full bg-farm-primary flex items-center justify-center">
              <UserIcon className="w-4 h-4 text-white" />
            </div>
            <span className="hidden sm:block text-sm font-semibold text-slate-800 dark:text-white max-w-[80px] truncate">
              {user?.name || 'Farmer'}
            </span>
          </motion.div>
        </Link>

        {/* Logout */}
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={handleLogout}
          className="w-9 h-9 rounded-2xl flex items-center justify-center bg-red-500/10 border border-red-400/20 hover:bg-red-500/20 text-red-500 transition-all"
        >
          <LogOut className="w-4 h-4" />
        </motion.button>
      </div>
    </motion.header>
  );
};

export default TopBar;
