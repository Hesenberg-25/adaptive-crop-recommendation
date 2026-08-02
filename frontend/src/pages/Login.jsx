import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import { Mail, Lock, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await axios.post('http://localhost:5000/api/auth/signin', { email, password });
      login(response.data.token);
      toast.success('Successfully logged in!');
      navigate('/dashboard', { state: { justLoggedIn: true } });
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to log in');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[70vh] px-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-panel p-8 w-full max-w-md"
      >
        <h2 className="text-3xl font-bold text-center text-slate-800 dark:text-white mb-8">Welcome Back</h2>
        
        <form onSubmit={handleLogin} className="flex flex-col gap-5">
          <div className="relative">
            <Mail className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
            <input 
              type="email" 
              placeholder="Email address" 
              className="glass-input w-full pl-10"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          
          <div className="relative">
            <Lock className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
            <input 
              type="password" 
              placeholder="Password" 
              className="glass-input w-full pl-10"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button type="submit" disabled={loading} className="glass-button w-full mt-2 flex justify-center items-center">
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Sign In'}
          </button>
        </form>

        <p className="mt-6 text-center text-slate-600 dark:text-slate-400">
          Don't have an account? <Link to="/signup" className="text-emerald-500 hover:underline">Sign up</Link>
        </p>
      </motion.div>
    </div>
  );
};

export default Login;
