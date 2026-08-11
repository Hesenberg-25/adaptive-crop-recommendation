import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Settings as SettingsIcon, User, ChevronRight, Trash2, AlertTriangle, Loader2 } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import toast from 'react-hot-toast';

const Settings = () => {
    const { user, token, logout } = useAuth();
  const navigate = useNavigate();
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleDeleteAccount = async () => {
    setLoading(true);
    try {
      await axios.delete(`${import.meta.env.VITE_API_URL}/api/farmer/profile`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Account deleted successfully');
      logout();
      navigate('/login');
    } catch (error) {
      toast.error('Failed to delete account');
      console.error(error);
    } finally {
      setLoading(false);
      setShowConfirm(false);
    }
  };

  const items = [
    {
      icon: <User className="w-5 h-5 text-emerald-500" />,
      label: 'Edit Profile',
      desc: 'Update your name, farm size, soil preferences',
      to: '/profile',
      bg: 'bg-emerald-100 dark:bg-emerald-900/30',
    },
  ];

  return (
    <div className="max-w-2xl mx-auto px-4 pt-24 pb-20">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-panel p-8 mb-6"
      >
        <div className="flex items-center gap-3 mb-1">
          <SettingsIcon className="w-7 h-7 text-farm-primary" />
          <h1 className="text-2xl font-bold font-poppins text-slate-800 dark:text-white">Settings</h1>
        </div>
        <p className="text-slate-500 dark:text-slate-400 text-sm">Manage your account and app preferences.</p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="glass-panel overflow-hidden mb-6"
      >
        {items.map((item, i) => (
          <Link key={i} to={item.to}>
            <motion.div
              whileHover={{ x: 4 }}
              className="flex items-center gap-4 p-5 border-b last:border-0 border-slate-200 dark:border-white/10 hover:bg-white/40 dark:hover:bg-white/5 transition-all cursor-pointer"
            >
              <div className={`w-11 h-11 rounded-2xl ${item.bg} flex items-center justify-center flex-shrink-0`}>
                {item.icon}
              </div>
              <div className="flex-grow">
                <div className="font-semibold text-slate-800 dark:text-white">{item.label}</div>
                <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{item.desc}</div>
              </div>
              <ChevronRight className="w-5 h-5 text-slate-400" />
            </motion.div>
          </Link>
        ))}
      </motion.div>

      {/* Danger Zone */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="glass-panel overflow-hidden border border-red-500/20"
      >
        <div className="p-5 border-b border-red-500/10 bg-red-50/50 dark:bg-red-900/10">
          <h3 className="font-bold text-red-600 dark:text-red-400">Danger Zone</h3>
        </div>
        <div 
          onClick={() => setShowConfirm(true)}
          className="flex items-center gap-4 p-5 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all cursor-pointer"
        >
          <div className="w-11 h-11 rounded-2xl bg-red-100 dark:bg-red-900/30 flex items-center justify-center flex-shrink-0">
            <Trash2 className="w-5 h-5 text-red-500" />
          </div>
          <div className="flex-grow">
            <div className="font-semibold text-red-600 dark:text-red-400">Delete Account</div>
            <div className="text-xs text-red-400/80 mt-0.5">Permanently delete your data and account</div>
          </div>
        </div>
      </motion.div>

      {/* Confirmation Modal */}
      <AnimatePresence>
        {showConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/40 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-[#1B2A17] border border-white/20 shadow-2xl rounded-[2rem] p-6 max-w-sm w-full text-center relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 right-0 h-1 bg-red-500" />
              <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mx-auto mb-4 text-red-500">
                <AlertTriangle className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold font-poppins text-slate-800 dark:text-white mb-2">Delete Account?</h3>
              <p className="text-sm text-slate-600 dark:text-slate-300 mb-6">
                This action cannot be undone. All your predictions, history, and profile data will be permanently removed.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowConfirm(false)}
                  className="flex-1 py-2.5 rounded-xl font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteAccount}
                  disabled={loading}
                  className="flex-1 py-2.5 rounded-xl font-semibold bg-red-500 hover:bg-red-600 text-white transition-colors flex items-center justify-center"
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Yes, Delete'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Settings;
