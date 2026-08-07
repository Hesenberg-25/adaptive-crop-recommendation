import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Sun, Moon, Bell, User as UserIcon, LogOut, MapPin, Loader2, Leaf, Globe } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';

const TopBar = ({ useLiveWeather, toggleLiveWeather, locationName, locLoading, language, languages, onLanguageChange }) => {
  const [showNotifs, setShowNotifs] = useState(false);
  const { t } = useTranslation();
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <motion.header
      initial={{ y: -60, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 120, damping: 20 }}
      className="fixed top-3 left-3 md:left-20 right-3 z-40 flex items-center justify-between gap-2
                 bg-white/20 dark:bg-[#1B2A17]/30 backdrop-blur-2xl
                 border border-white/30 dark:border-white/10
                 shadow-[0_8px_40px_rgba(0,0,0,0.15)] dark:shadow-[0_8px_40px_rgba(0,0,0,0.4)]
                 rounded-[1.5rem] px-3 md:px-5 py-2.5 md:py-3"
    >
      {/* Left — Brand */}
      <div className="flex items-center gap-2 md:gap-4">
        <div className="flex items-center gap-2 text-farm-primary dark:text-farm-text-heading font-extrabold font-poppins text-base md:text-lg select-none">
          <Leaf className="w-5 h-5 text-farm-primary" />
          <span className="hidden sm:inline">AgriVision</span>
        </div>
      </div>

      {/* Right — Actions */}
      <div className="flex items-center gap-1.5 md:gap-3">
        {/* Location toggle (only shown when authenticated, hidden on mobile) */}
        {useLiveWeather !== undefined && (
          <div className="hidden lg:flex items-center gap-3 bg-white/30 dark:bg-white/5 border border-white/30 dark:border-white/10 rounded-2xl px-4 py-1.5 mr-2">
            <MapPin className="w-4 h-4 text-farm-accent-gold flex-shrink-0" />
            <div className="flex flex-col">
              <span className="text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400 leading-none">{t('live_weather', 'Live Location')}</span>
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
                    <Loader2 className="w-3 h-3 animate-spin" /> {t('fetching', 'Fetching…')}
                  </motion.span>
                ) : (
                  <motion.span key="off" className="text-xs text-slate-400">{t('off', 'Off')}</motion.span>
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

        {/* Language Selector */}
        {languages && (
          <div className="flex items-center gap-1 bg-white/30 dark:bg-white/5 border border-white/30 dark:border-white/10 rounded-2xl px-2 md:px-3 py-1.5">
            <Globe className="w-4 h-4 text-farm-accent-gold flex-shrink-0" />
            <select
              value={language}
              onChange={(e) => onLanguageChange(e.target.value)}
              className="bg-transparent text-xs md:text-sm font-medium text-slate-800 dark:text-slate-200 focus:outline-none cursor-pointer max-w-[80px] md:max-w-none"
            >
              {languages.map(lang => (
                <option key={lang.code} value={lang.code} className="bg-white dark:bg-slate-800">{lang.label}</option>
              ))}
            </select>
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

        {/* Profile */}
        <Link to="/profile">
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="flex items-center gap-2 bg-white/30 dark:bg-white/10 border border-white/30 dark:border-white/10 rounded-2xl px-2 md:px-3 py-1.5 cursor-pointer hover:bg-white/50 dark:hover:bg-white/20 transition-all"
          >
            <div className="w-7 h-7 rounded-full bg-farm-primary flex items-center justify-center">
              <UserIcon className="w-4 h-4 text-white" />
            </div>
            <span className="hidden md:block text-sm font-semibold text-slate-800 dark:text-white max-w-[80px] truncate">
              {user?.name || t('profile', 'Farmer')}
            </span>
          </motion.div>
        </Link>

        {/* Logout */}
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={handleLogout}
          className="w-9 h-9 rounded-2xl flex items-center justify-center bg-red-500/10 border border-red-400/20 hover:bg-red-500/20 text-red-500 transition-all"
          title={t('logout', 'Logout')}
        >
          <LogOut className="w-4 h-4" />
        </motion.button>
      </div>
    </motion.header>
  );
};

export default TopBar;
