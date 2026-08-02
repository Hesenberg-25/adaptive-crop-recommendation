import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Leaf, LogOut, Moon, Sun, User as UserIcon, History as HistoryIcon } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { motion } from 'framer-motion';

const Navbar = () => {
  const { isAuthenticated, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <motion.nav 
      initial={{ y: -50, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="sticky top-4 z-50 mx-4 md:mx-auto max-w-6xl glass-panel !rounded-full px-6 py-4 flex justify-between items-center mb-8"
    >
      <Link to="/" className="flex items-center gap-2">
        <Leaf className="text-emerald-500 w-8 h-8" />
        <span className="text-xl font-extrabold font-poppins text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 to-cyan-500">
          AgriVision
        </span>
      </Link>

      <div className="flex items-center gap-4">
        <button 
          onClick={toggleTheme} 
          className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
          aria-label="Toggle theme"
        >
          {theme === 'dark' ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5 text-slate-700" />}
        </button>

        {isAuthenticated ? (
          <>
            <Link to="/dashboard" className="hidden sm:block text-slate-600 dark:text-slate-300 hover:text-emerald-500 transition-colors">
              Dashboard
            </Link>
            <Link to="/history" className="hidden sm:block text-slate-600 dark:text-slate-300 hover:text-emerald-500 transition-colors">
              <HistoryIcon className="w-5 h-5 inline mr-1 mb-1" />
              History
            </Link>
            <Link to="/profile" className="hidden sm:block text-slate-600 dark:text-slate-300 hover:text-emerald-500 transition-colors">
              <UserIcon className="w-5 h-5 inline mr-1 mb-1" />
              Profile
            </Link>
            <button 
              onClick={handleLogout}
              className="flex items-center gap-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 px-4 py-2 rounded-xl transition-all"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </>
        ) : (
          <div className="flex items-center gap-2">
            <Link to="/login" className="text-slate-600 dark:text-slate-300 hover:text-emerald-500 transition-colors px-4 py-2">
              Login
            </Link>
            <Link to="/signup" className="glass-button">
              Sign Up
            </Link>
          </div>
        )}
      </div>
    </motion.nav>
  );
};

export default Navbar;
