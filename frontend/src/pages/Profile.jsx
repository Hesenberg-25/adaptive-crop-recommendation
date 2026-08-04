import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { User as UserIcon, Phone, Mail, MapPin, Maximize, Wheat, Save, Loader2, Map, Droplet } from 'lucide-react';
import toast from 'react-hot-toast';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import CustomSelect from '../components/CustomSelect';

const soilOptions = [
  { value: "alluvial", label: "Alluvial (Northern)" },
  { value: "black", label: "Black (Deccan)" },
  { value: "red", label: "Red (East)" },
  { value: "laterite", label: "Laterite (Ghats)" }
];

const Profile = () => {
  const { token } = useAuth();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  
  const [profile, setProfile] = useState({
    name: '',
    phone: '',
    email: '',
    location: '',
    farm_size: '',
    primary_crops: '',
    soil_type: '',
    irrigation_type: 'rainfed'
  });

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await axios.get('http://localhost:5000/api/farmer/profile', {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (response.data) {
          setProfile(prev => ({ ...prev, ...response.data }));
        }
      } catch (_error) {
        console.error("No existing profile found or error fetching");
      } finally {
        setFetching(false);
      }
    };
    if (token) fetchProfile();
    else setFetching(false);
  }, [token]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProfile(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = { ...profile };
      if (payload.farm_size === '') payload.farm_size = null;
      else if (payload.farm_size !== null) payload.farm_size = parseFloat(payload.farm_size);

      await axios.put('http://localhost:5000/api/farmer/profile', payload, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Profile saved successfully!');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to save profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return <div className="min-h-[50vh] flex justify-center items-center"><Loader2 className="w-8 h-8 animate-spin text-emerald-500" /></div>;
  }

  return (
    <div className="container mx-auto px-4 max-w-3xl pb-12">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-panel p-8 mt-4"
      >
        <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-6 flex items-center gap-2 font-poppins relative after:absolute after:bottom-[-8px] after:left-0 after:w-16 after:h-[2px] after:bg-gradient-to-r after:from-farm-accent-gold after:to-farm-primary">
          <UserIcon className="w-6 h-6 text-farm-primary" />
          Farmer Profile
        </h2>
        
        <form onSubmit={handleSave} className="flex flex-col gap-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Full Name</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <UserIcon className="w-4 h-4 text-farm-primary-light" />
                </div>
                <input 
                  type="text" 
                  name="name"
                  value={profile.name || ''}
                  onChange={handleChange}
                  className="w-full pl-9 pr-3 py-2 glass-input"
                  placeholder="John Doe"
                  required
                />
              </div>
            </div>
            
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Phone Number</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Phone className="w-4 h-4 text-farm-primary-light" />
                </div>
                <input 
                  type="tel" 
                  name="phone"
                  value={profile.phone || ''}
                  onChange={handleChange}
                  className="w-full pl-9 pr-3 py-2 glass-input"
                  placeholder="+91 9876543210"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1 md:col-span-2">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Email Address</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="w-4 h-4 text-farm-primary-light" />
                </div>
                <input 
                  type="email" 
                  name="email"
                  value={profile.email || ''}
                  onChange={handleChange}
                  className="w-full pl-9 pr-3 py-2 glass-input"
                  placeholder="farmer@example.com"
                  required
                />
              </div>
            </div>

            <div className="flex flex-col gap-1 md:col-span-2">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Farm Location (Village/District/State)</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <MapPin className="w-4 h-4 text-farm-primary-light" />
                </div>
                <input 
                  type="text" 
                  name="location"
                  value={profile.location || ''}
                  onChange={handleChange}
                  className="w-full pl-9 pr-3 py-2 glass-input"
                  placeholder="Pune, Maharashtra"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Farm Size (Acres)</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Maximize className="w-4 h-4 text-farm-primary-light" />
                </div>
                <input 
                  type="number" 
                  name="farm_size"
                  value={profile.farm_size ?? ''}
                  onChange={handleChange}
                  min="0"
                  step="0.1"
                  className="w-full pl-9 pr-3 py-2 glass-input"
                  placeholder="5.5"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Primary Crops</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Wheat className="w-4 h-4 text-farm-primary-light" />
                </div>
                <input 
                  type="text" 
                  name="primary_crops"
                  value={profile.primary_crops || ''}
                  onChange={handleChange}
                  className="w-full pl-9 pr-3 py-2 glass-input"
                  placeholder="Wheat, Cotton"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1 z-20">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Soil Type</label>
              <CustomSelect 
                value={profile.soil_type || ''}
                onChange={(val) => setProfile(prev => ({ ...prev, soil_type: val }))}
                placeholder="Select Soil Profile..."
                icon={<Map className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />}
                options={soilOptions}
              />
            </div>

            <div className="flex flex-col gap-1 z-10">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Irrigation</label>
              <CustomSelect 
                value={profile.irrigation_type || 'rainfed'}
                onChange={(val) => setProfile(prev => ({ ...prev, irrigation_type: val }))}
                placeholder="Irrigation..."
                icon={<Droplet className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />}
                options={[
                  { value: "rainfed", label: "Rainfed" },
                  { value: "irrigated", label: "Fully Irrigated" }
                ]}
              />
            </div>
          </div>

          <div className="mt-4 flex justify-end">
            <button 
              type="submit"
              disabled={loading}
              className="glass-button py-2 px-6 flex items-center gap-2"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Save Profile
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default Profile;
