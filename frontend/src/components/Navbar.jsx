import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Leaf, LogOut, Moon, Sun, User as UserIcon, History as HistoryIcon } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { motion } from 'framer-motion';

const Navbar = () => {
  const { isAuthenticated, logout, user } = useAuth();
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
      className="sticky top-4 z-50 mx-4 md:mx-auto max-w-6xl glass-panel !rounded-full px-6 py-4 flex justify-between items-center mb-8 bg-white/80 dark:bg-[#1B2A17]/90 transition-colors"
    >
      <Link to="/" className="flex items-center gap-2">
        <Leaf className="text-farm-primary w-8 h-8" />
        <span className="text-xl font-extrabold font-poppins text-farm-primary">
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
            <Link to="/dashboard" className="hidden sm:block text-farm-primary dark:text-[#10190F] bg-[#F5D98B] dark:bg-farm-accent-gold px-4 py-2 rounded-full font-medium transition-colors">
              Dashboard
            </Link>
            <Link to="/history" className="hidden sm:block text-farm-primary dark:text-farm-text-body hover:text-farm-primary-light dark:hover:text-farm-primary transition-colors px-2 py-2">
              <HistoryIcon className="w-5 h-5 inline mr-1 mb-1" />
              History
            </Link>
            <Link to="/profile" className="hidden sm:flex items-center bg-farm-primary text-white dark:bg-[#223321] dark:border dark:border-farm-accent-gold dark:text-farm-text-heading hover:bg-farm-primary-light hover:scale-[1.02] hover:brightness-110 px-4 py-2 rounded-full transition-all font-medium shadow-[0_4px_14px_rgba(139,105,20,0.08)] dark:shadow-none">
              <UserIcon className="w-5 h-5 mr-2 text-farm-accent-gold" />
              {user?.name || 'Farmer'}
            </Link>
            <button 
              onClick={handleLogout}
              className="flex items-center gap-2 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/40 text-red-600 dark:text-red-400 px-4 py-2 rounded-full hover:scale-[1.02] transition-all"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </>
        ) : (
          <div className="flex items-center gap-2">
            <Link to="/login" className="text-farm-primary hover:text-farm-primary-light transition-colors px-4 py-2">
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
