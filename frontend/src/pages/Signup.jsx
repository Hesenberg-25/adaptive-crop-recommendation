import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import { Mail, Lock, Loader2, User, Phone, MapPin, Maximize, Leaf, Droplets, Map } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Signup = () => {
    const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [location, setLocation] = useState('');
  const [farmSize, setFarmSize] = useState('');
  const [primaryCrops, setPrimaryCrops] = useState('');
  const [soilType, setSoilType] = useState('');
  const [irrigationType, setIrrigationType] = useState('rainfed');
  
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const { login } = useAuth();
  
  const handleSignup = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      // 1. Create the user account
      const authResponse = await axios.post(`${import.meta.env.VITE_API_URL}/api/auth/signup`, { email, password });
      
      const token = authResponse.data.token;
      const refreshTk = authResponse.data.refresh_token;
      if (token) {
        // 2. Immediately save profile details
        const profilePayload = {
            full_name: fullName,
            phone_number: phoneNumber,
            location: location,
            farm_size: farmSize ? parseFloat(farmSize) : null,
            primary_crops: primaryCrops,
            soil_type: soilType || null,
            irrigation_type: irrigationType
        };

        try {
            await axios.put(`${import.meta.env.VITE_API_URL}/api/farmer/profile`, profilePayload, {
                headers: { Authorization: `Bearer ${token}` }
            });
        } catch (profileError) {
            console.error("Failed to save profile details during signup:", profileError);
            toast.error("Account created, but some profile details failed to save.");
        }

        login(token, refreshTk);

        toast.success('Account created and profile saved successfully!');
        // 3. Redirect to dashboard directly
        navigate('/dashboard', { state: { justLoggedIn: true } });
      } else {
        toast.success('Account created successfully! Please log in.');
        navigate('/login');
      }
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to create account');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[90vh] px-4 py-8">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-panel p-8 w-full max-w-2xl"
      >
        <h2 className="text-3xl font-bold text-center text-slate-800 dark:text-white mb-2">Join AgriVision</h2>
        <p className="text-center text-slate-600 dark:text-slate-400 mb-8">Create your account and set up your farming profile.</p>
        
        <form onSubmit={handleSignup} className="flex flex-col gap-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Account Details */}
              <div className="col-span-1 md:col-span-2">
                  <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-3 border-b border-slate-200 dark:border-white/10 pb-2">Account Details</h3>
              </div>

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
                  placeholder="Create a strong password" 
                  className="glass-input w-full pl-10"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength="6"
                />
              </div>

              {/* Farmer Profile */}
              <div className="col-span-1 md:col-span-2 mt-2">
                  <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-3 border-b border-slate-200 dark:border-white/10 pb-2">Farmer Profile</h3>
              </div>

              <div className="relative">
                <User className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="Full Name" 
                  className="glass-input w-full pl-10"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                />
              </div>

              <div className="relative">
                <Phone className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
                <input 
                  type="tel" 
                  placeholder="Phone Number" 
                  className="glass-input w-full pl-10"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                />
              </div>

              <div className="relative col-span-1 md:col-span-2">
                <MapPin className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="Farm Location (Village/District/State)" 
                  className="glass-input w-full pl-10"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                />
              </div>

              <div className="relative">
                <Maximize className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
                <input 
                  type="number" 
                  step="0.1"
                  placeholder="Farm Size (Acres)" 
                  className="glass-input w-full pl-10"
                  value={farmSize}
                  onChange={(e) => setFarmSize(e.target.value)}
                />
              </div>

              <div className="relative">
                <Leaf className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="Primary Crops (e.g. Wheat, Cotton)" 
                  className="glass-input w-full pl-10"
                  value={primaryCrops}
                  onChange={(e) => setPrimaryCrops(e.target.value)}
                />
              </div>

              <div className="relative">
                <Map className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
                <select 
                    className="glass-input w-full pl-10 appearance-none bg-transparent"
                    value={soilType}
                    onChange={(e) => setSoilType(e.target.value)}
                >
                    <option value="" className="bg-white dark:bg-black text-slate-500">Select Soil Profile...</option>
                    <option value="alluvial" className="bg-white dark:bg-black text-slate-800 dark:text-white">Alluvial (Rich, fertile, river basins)</option>
                    <option value="black" className="bg-white dark:bg-black text-slate-800 dark:text-white">Black / Regur (Cotton-friendly, high moisture retention)</option>
                    <option value="red" className="bg-white dark:bg-black text-slate-800 dark:text-white">Red / Yellow (Iron-rich, needs fertilizers)</option>
                    <option value="laterite" className="bg-white dark:bg-black text-slate-800 dark:text-white">Laterite (Acidic, good for tea/coffee/cashew)</option>
                    <option value="arid" className="bg-white dark:bg-black text-slate-800 dark:text-white">Arid / Desert (Sandy, saline, requires irrigation)</option>
                    <option value="mountain" className="bg-white dark:bg-black text-slate-800 dark:text-white">Mountain / Forest (Rich in humus, acidic)</option>
                    <option value="saline" className="bg-white dark:bg-black text-slate-800 dark:text-white">Saline / Alkaline (High salt content, needs treatment)</option>
                    <option value="peaty" className="bg-white dark:bg-black text-slate-800 dark:text-white">Peaty / Marshy (High organic matter, heavy)</option>
                </select>
              </div>

              <div className="relative">
                <Droplets className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
                <select 
                    className="glass-input w-full pl-10 appearance-none bg-transparent"
                    value={irrigationType}
                    onChange={(e) => setIrrigationType(e.target.value)}
                >
                    <option value="rainfed" className="bg-white dark:bg-black text-slate-800 dark:text-white">Rainfed</option>
                    <option value="irrigated" className="bg-white dark:bg-black text-slate-800 dark:text-white">Fully Irrigated</option>
                </select>
              </div>
          </div>

          <button type="submit" disabled={loading} className="glass-button w-full mt-4 flex justify-center items-center py-3 text-lg font-semibold">
            {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : 'Complete Setup & Dashboard'}
          </button>
        </form>

        <p className="mt-8 text-center text-slate-600 dark:text-slate-400">
          Already have an account? <Link to="/login" className="text-emerald-500 hover:underline font-semibold">Log in</Link>
        </p>
      </motion.div>
    </div>
  );
};

export default Signup;
