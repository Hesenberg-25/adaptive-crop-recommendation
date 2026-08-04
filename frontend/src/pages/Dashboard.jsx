import React, { useState, useEffect } from 'react';
import Tooltip from '../components/Tooltip';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import { Loader2, MapPin } from 'lucide-react';
import Controls from '../components/Controls';
import Simulator from '../components/Simulator';
import ResultsCards from '../components/ResultsCards';
import GovernmentSchemes from '../components/GovernmentSchemes';
import AIAdvice from '../components/AIAdvice';
import { useAuth } from '../context/AuthContext';
import CropCatalog from '../components/CropCatalog';
import { useLocation } from 'react-router-dom';

import axios from 'axios';

const Dashboard = () => {
  const { token } = useAuth();
  const locationState = useLocation().state || {};
  const isJustLoggedIn = locationState.justLoggedIn;
  
  const [inputs, setInputs] = useState({
    N: 90, P: 42, K: 43, pH: 6.5, temperature: 24, humidity: 82, rainfall: 220
  });
  const [droughtReduction, setDroughtReduction] = useState(0);
  
  const [useLiveWeather, setUseLiveWeather] = useState(false);
  const [location, setLocation] = useState({ lat: null, lon: null });
  const [locationName, setLocationName] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingText, setLoadingText] = useState('Run AI Prediction');
  const [results, setResults] = useState(null);
  const [season, setSeason] = useState('auto');
  const [isIrrigated, setIsIrrigated] = useState(false);
  const [technique, setTechnique] = useState('monocropping');
  const [soilType, setSoilType] = useState('');

  useEffect(() => {
    if (!token) return;
    const fetchProfile = async () => {
      try {
        const response = await axios.get('http://localhost:5000/api/farmer/profile', {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (response.data) {
          if (response.data.soil_type) setSoilType(response.data.soil_type);
          if (response.data.irrigation_type) setIsIrrigated(response.data.irrigation_type === 'irrigated');
        }
      } catch (_error) {
        // Ignored
      }
    };
    fetchProfile();
  }, [token]);

  const handleInputChange = (key, value) => {
    setInputs(prev => ({ ...prev, [key]: value }));
  };

  const toggleLiveWeather = () => {
    if (!useLiveWeather) {
      if (!navigator.geolocation) {
        toast.error('Geolocation is not supported by your browser');
        return;
      }
      
      const loadToast = toast.loading('Getting location...');
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lon = position.coords.longitude;
          setLocation({ lat, lon });
          setUseLiveWeather(true);
          toast.success('Location synced!', { id: loadToast });
          
          axios.get(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`)
            .then(res => {
              const address = res.data.address || {};
              const name = address.city || address.town || address.village || address.county || 'Your Location';
              const region = address.state || address.country || '';
              setLocationName(region ? `${name}, ${region}` : name);
            })
            .catch(() => setLocationName('Your Location'));
        },
        (_error) => {
          toast.error('Failed to get location. Please allow access.', { id: loadToast });
          setUseLiveWeather(false);
        }
      );
    } else {
      setUseLiveWeather(false);
      setLocation({ lat: null, lon: null });
      setLocationName('');
    }
  };

  const handlePredict = async () => {
    setLoading(true);
    
    const loadingStates = [
      "Initializing ML Engine...",
      "Running K-Nearest Neighbors...",
      "Calculating SHAP Feature Importance...",
      "Live Web-Scraping for Market Prices...",
      "Generating Expert Agronomist Report...",
      "Finalizing Results..."
    ];
    let stateIndex = 0;
    setLoadingText(loadingStates[stateIndex]);
    
    const intervalId = setInterval(() => {
      stateIndex = (stateIndex + 1) % loadingStates.length;
      if (stateIndex === loadingStates.length - 1) clearInterval(intervalId);
      setLoadingText(loadingStates[stateIndex]);
    }, 1200);

    try {
      const payload = {
        ...inputs,
        rainfall: inputs.rainfall * (1 - droughtReduction / 100),
        useLiveWeather,
        lat: location.lat,
        lon: location.lon,
        season,
        isIrrigated,
        technique,
        soilType
      };
      
      const response = await axios.post('http://localhost:5000/api/predict', payload, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      clearInterval(intervalId);
      setResults(response.data);
      toast.success('Prediction generated & saved to database!');
    } catch (error) {
      clearInterval(intervalId);
      toast.error(error.response?.data?.error || 'Failed to generate prediction');
    } finally {
      setLoading(false);
      setLoadingText('Run AI Prediction');
    }
  };

  const crazyVariants = {
    hidden: { opacity: 0, scale: 0.3, rotateX: 90, rotateY: 45, y: -200 },
    visible: { 
      opacity: 1, 
      scale: 1, 
      rotateX: 0, 
      rotateY: 0, 
      y: 0,
      transition: { type: "spring", damping: 12, stiffness: 80, duration: 1.2 }
    }
  };

  return (
    <motion.div 
      variants={isJustLoggedIn ? crazyVariants : {}}
      initial={isJustLoggedIn ? "hidden" : false}
      animate={isJustLoggedIn ? "visible" : false}
      className="container mx-auto px-4 max-w-6xl pb-12"
    >
      <header className="mb-10 text-center">
        <motion.h1 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-4xl font-extrabold font-playfair mb-2"
        >
          <span className="text-farm-primary dark:text-farm-text-heading transition-colors">Adaptive Crop</span>{' '}
          <span className="text-farm-accent-orange transition-colors">Dashboard</span>
        </motion.h1>
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-farm-text-body font-lora text-lg italic"
        >
          Configure your soil parameters and get real-time AI recommendations
        </motion.p>
      </header>

      <div className="flex flex-col gap-8 items-center max-w-4xl mx-auto">
        {/* Top Section - Inputs */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full flex flex-col gap-6"
        >
          <div className="bg-farm-primary dark:bg-[#223321] rounded-3xl p-4 flex justify-between items-center shadow-md transition-colors">
            <div className="flex items-center gap-2 text-white font-medium">
              <MapPin className="w-5 h-5 text-farm-accent-gold" />
              Use Live Weather
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" checked={useLiveWeather} onChange={toggleLiveWeather} />
              <div className="w-11 h-6 bg-white/20 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-white after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-farm-primary-light dark:peer-checked:bg-[#E8B94A] dark:peer-checked:shadow-[0_0_10px_#6FA657]"></div>
            </label>
          </div>

          <Controls 
            values={inputs} 
            onChange={handleInputChange} 
            useLiveWeather={useLiveWeather}
            season={season}
            setSeason={setSeason}
            isIrrigated={isIrrigated}
            setIsIrrigated={setIsIrrigated}
            technique={technique}
            setTechnique={setTechnique}
            soilType={soilType}
            setSoilType={setSoilType}
          />
          
          <Simulator 
            baseRainfall={inputs.rainfall} 
            reductionPercent={droughtReduction} 
            onReductionChange={setDroughtReduction} 
          />
          
          <CropCatalog />
          
          <button 
            onClick={handlePredict}
            disabled={loading}
            className="w-full py-4 text-lg flex justify-center items-center mt-2 font-poppins relative overflow-hidden rounded-2xl bg-gradient-to-r from-farm-accent-gold to-farm-accent-orange text-white dark:text-[#10190F] font-bold shadow-lg transition-transform hover:scale-[1.02] dark:hover:shadow-[0_0_15px_#E8B94A]"
          >
            {loading && <Loader2 className="w-6 h-6 animate-spin mr-3" />}
            <span className="min-w-[250px] text-center flex items-center justify-center gap-2">
                {loadingText} {!loading && <span className="text-xl">→</span>}
            </span>
          </button>
        </motion.div>

        {/* Bottom Section - Results */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full flex flex-col gap-6"
        >
          {results ? (
            <>
              {results.weatherUsed && (
                <div className="glass-panel p-4 text-sm text-slate-600 dark:text-slate-300 bg-emerald-500/10 border-emerald-500/30">
                  <span className="font-semibold text-emerald-700 dark:text-emerald-400">Model Input Weather:</span> 
                  {' '}{results.weatherUsed.temperature.toFixed(1)}°C, 
                  {' '}{results.weatherUsed.humidity.toFixed(1)}% Humidity, 
                  {' '}{results.weatherUsed.rainfall.toFixed(1)}mm Rainfall,
                  {' '}{results.weatherUsed.windSpeed ? results.weatherUsed.windSpeed.toFixed(1) : '15.0'}km/h Wind.
                  {useLiveWeather && (
                    <div className="mt-1 text-xs font-semibold text-emerald-800 dark:text-emerald-300">
                      📍 Geolocation: {locationName || 'Fetching...'}
                    </div>
                  )}
                </div>
              )}
              <div className="flex flex-col gap-8">
                {results.alerts && results.alerts.length > 0 && (
                  <section>
                    <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-300 mb-3 ml-2 font-poppins flex items-center">
                      Pest & Disease Alerts
                      <Tooltip text="AI-generated warnings based on specific weather conditions that increase the risk of crop diseases or pest outbreaks." />
                    </h3>
                    <div className="flex flex-col gap-3">
                      {results.alerts.map((alert, idx) => (
                        <div key={idx} className={`p-4 rounded-xl border ${alert.severity === 'high' ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-800 dark:text-red-200' : 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200'}`}>
                          <div className="font-bold mb-2 flex items-center gap-2 text-base">
                            <span>{alert.severity === 'high' ? '🔴' : '🟡'}</span>
                            {alert.risk} <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ml-1 ${alert.severity === 'high' ? 'bg-red-200 dark:bg-red-800 text-red-900 dark:text-red-100' : 'bg-amber-200 dark:bg-amber-800 text-amber-900 dark:text-amber-100'}`}>{alert.severity.toUpperCase()} RISK</span>
                          </div>
                          <div className="text-sm leading-relaxed whitespace-pre-line">
                            {alert.message}
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>
                )}
                <section>
                  <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-300 mb-3 ml-2 font-poppins flex items-center">
                    ML Predictions & Crop Analysis
                    <Tooltip text="Analyzes your exact NPK, pH, and Weather data to categorize crops into Highly Recommended and Avoid. Includes ROI %, net return in ₹, and Rainfall Fit score." />
                  </h3>
                  <ResultsCards recommendedCrops={results.recommendedCrops} avoidCrops={results.avoidCrops} />
                </section>
                
                <section>
                  <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-300 mb-3 ml-2 font-poppins flex items-center">
                    Govt. Subsidies & Schemes
                    <Tooltip text="Automatically matches your recommended crop to eligible government subsidies, MSP guarantees, and input support schemes to maximize your income." />
                  </h3>
                  <GovernmentSchemes subsidyData={results.governmentSubsidies?.[0]} />
                </section>
                
                <section>
                  <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-300 mb-3 ml-2 font-poppins flex items-center">
                    Expert Insights
                    <Tooltip text="Queries Google Gemini AI to analyze the specific soil features that drove the ML prediction, generating tailored agronomic advice." />
                  </h3>
                  <AIAdvice adviceText={results.aiAdvice} />
                </section>
              </div>
            </>
          ) : (
            <div className="glass-panel h-full min-h-[400px] flex items-center justify-center text-slate-500 dark:text-slate-400 font-lora italic">
              Run a prediction to see AI results here.
            </div>
          )}
        </motion.div>
        
        {/* Feature Tiles */}
        <div className="w-full max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-5 gap-4 mt-6">
          {[
            { title: "Smart Farming", color: "bg-farm-primary dark:bg-[#1F3319]", icon: "🌱" },
            { title: "Save Water", color: "bg-farm-accent-gold dark:bg-[#8A6A1E]", icon: "💧" },
            { title: "Improve Soil", color: "bg-[#6B4423] dark:bg-[#3D2B1A]", icon: "🌍" },
            { title: "Boost Yield", color: "bg-farm-primary-light dark:bg-[#2F4B26]", icon: "📈" },
            { title: "AI Powered", color: "bg-farm-accent-orange dark:bg-[#7A4A18]", icon: "🤖" },
          ].map((tile, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className={`p-4 rounded-2xl flex flex-col justify-between items-start h-32 ${tile.color} text-white dark:text-farm-text-heading dark:border-t dark:border-white/10 shadow-md cursor-pointer hover:-translate-y-1 transition-transform relative overflow-hidden`}
            >
              <div className="w-8 h-8 rounded-full bg-white/20 dark:bg-farm-accent-gold/20 flex items-center justify-center text-lg backdrop-blur-sm">
                {tile.icon}
              </div>
              <span className="font-bold font-poppins text-sm md:text-base leading-tight pr-4">
                {tile.title}
              </span>
              <div className="absolute bottom-3 right-3 opacity-70 text-white dark:text-farm-accent-gold">
                ↗
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  );
};

export default Dashboard;
