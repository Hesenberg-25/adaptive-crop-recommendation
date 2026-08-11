import React, { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import Controls from '../components/Controls';
import Simulator from '../components/Simulator';
import ResultsCards from '../components/ResultsCards';
import GovernmentSchemes from '../components/GovernmentSchemes';
import AIAdvice from '../components/AIAdvice';
import { useAuth } from '../context/AuthContext';
import { useLocation } from 'react-router-dom';

import axios from 'axios';

// SessionStorage helpers
const STORAGE_KEY = 'agrivision_dashboard';
const saveState = (state) => {
  try { sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch { }
};
const loadState = () => {
  try { const s = sessionStorage.getItem(STORAGE_KEY); return s ? JSON.parse(s) : null; } catch { return null; }
};

const Dashboard = ({ externalUseLiveWeather, externalLocation, externalLocationName, language: langProp }) => {
  const { token } = useAuth();
  const locationState = useLocation().state || {};
  const isJustLoggedIn = locationState.justLoggedIn;
  const scanData = locationState.scanData;
  const autoPredict = locationState.autoPredict;

  // Restore state from sessionStorage
  const saved = loadState();

  const [inputs, setInputs] = useState(() => {
    const defaultInputs = saved?.inputs || {
      N: 90, P: 42, K: 43, pH: 6.5, temperature: 24, humidity: 82, rainfall: 220
    };
    if (scanData) {
      console.log('Applying scanned soil data to Dashboard:', scanData);
      if (scanData.N !== undefined) defaultInputs.N = parseFloat(scanData.N);
      if (scanData.P !== undefined) defaultInputs.P = parseFloat(scanData.P);
      if (scanData.K !== undefined) defaultInputs.K = parseFloat(scanData.K);
      if (scanData.pH !== undefined) defaultInputs.pH = parseFloat(scanData.pH);
    }
    return defaultInputs;
  });
  const [droughtReduction, setDroughtReduction] = useState(saved?.droughtReduction || 0);

  // Location/weather — driven by TopBar via props
  const useLiveWeather = externalUseLiveWeather || false;
  const location = externalLocation || { lat: null, lon: null };
  const locationName = externalLocationName || '';
  const [loading, setLoading] = useState(false);
  const [loadingText, setLoadingText] = useState('');
  const [results, setResults] = useState(saved?.results || null);
  const [season, setSeason] = useState(saved?.season || 'auto');
  const [isIrrigated, setIsIrrigated] = useState(saved?.isIrrigated || false);
  const [technique, setTechnique] = useState(saved?.technique || 'monocropping');
  const [soilType, setSoilType] = useState(() => {
    if (scanData?.soilType) {
      const types = ['black', 'red', 'alluvial', 'laterite', 'sandy', 'loamy', 'clay'];
      const matched = types.find(t => scanData.soilType.toLowerCase().includes(t));
      if (matched) return matched;
    }
    return saved?.soilType || '';
  });
  const language = langProp || 'en';

  // Target Crop Feature
  const [cropCategory, setCropCategory] = useState(saved?.cropCategory || '');
  const [targetCrop, setTargetCrop] = useState(saved?.targetCrop || '');
  const [userProfile, setUserProfile] = useState({});

  // UI Toggles for Results
  const [showAI, setShowAI] = useState(false);
  const [showGovt, setShowGovt] = useState(false);

  // Persist state to sessionStorage on changes
  useEffect(() => {
    saveState({ inputs, droughtReduction, season, isIrrigated, technique, soilType, cropCategory, targetCrop, results });
  }, [inputs, droughtReduction, season, isIrrigated, technique, soilType, cropCategory, targetCrop, results]);

  useEffect(() => {
    if (scanData) {
      toast.success('AI Soil Scan applied to Dashboard!');
      // Clear location state so a page refresh doesn't re-apply the scan values
      window.history.replaceState({}, document.title);
    }
  }, [scanData]);

  // Weather Code helper
  const getWeatherEmoji = (code) => {
    if (code === 0) return '☀️';
    if (code > 0 && code < 4) return '⛅';
    if (code >= 45 && code <= 48) return '🌫️';
    if (code >= 51 && code <= 67) return '🌧️';
    if (code >= 71 && code <= 77) return '❄️';
    if (code >= 80 && code <= 82) return '🌦️';
    if (code >= 95) return '⛈️';
    return '🌈';
  };

  useEffect(() => {
    if (!token) return;
    const fetchProfile = async () => {
      try {
        const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/farmer/profile`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (response.data) {
          setUserProfile(response.data);
          // Only set from profile if no saved state
          if (!saved && !scanData) {
            if (response.data.soil_type) {
              const types = ['black', 'red', 'alluvial', 'laterite', 'sandy', 'loamy', 'clay'];
              const matched = types.find(t => response.data.soil_type.toLowerCase().includes(t));
              if (matched) setSoilType(matched);
            }
            if (response.data.irrigation_type) setIsIrrigated(response.data.irrigation_type === 'irrigated');
            
            // Apply soil nutrients from profile if they exist
            setInputs(prev => {
              const newInputs = { ...prev };
              if (response.data.soil_n !== undefined && response.data.soil_n !== null) newInputs.N = parseFloat(response.data.soil_n);
              if (response.data.soil_p !== undefined && response.data.soil_p !== null) newInputs.P = parseFloat(response.data.soil_p);
              if (response.data.soil_k !== undefined && response.data.soil_k !== null) newInputs.K = parseFloat(response.data.soil_k);
              if (response.data.soil_ph !== undefined && response.data.soil_ph !== null) newInputs.pH = parseFloat(response.data.soil_ph);
              return newInputs;
            });
          }
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

  const handlePredict = async () => {
    setLoading(true);

    const loadingStates = [
      'Initializing AI Model...',
      'Running KNN Engine...',
      'Calculating Feature Importance...',
      'Fetching Live Mandi Prices...',
      'Generating Full Report...',
      'Finalizing Results...'
    ];
    let stateIndex = 0;
    setLoadingText(loadingStates[stateIndex]);

    const intervalId = setInterval(() => {
      stateIndex = (stateIndex + 1) % loadingStates.length;
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
        soilType,
        language,
        targetCrop: targetCrop || null,
        farmSize: userProfile.farm_size || null,
        primaryCrops: userProfile.primary_crops || null
      };

      const response = await axios.post(`${import.meta.env.VITE_API_URL}/api/predict`, payload, {
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
      setLoadingText('');
    }
  };

  useEffect(() => {
    if (autoPredict && !loading && !results) {
      handlePredict();
    }
  }, [autoPredict]);

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
      className="container mx-auto px-3 md:px-4 max-w-[85rem] pb-28 md:pb-44"
    >
      <header className="mb-6 md:mb-10 text-center">
        <motion.h1
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-2xl md:text-4xl font-extrabold font-playfair mb-2 flex items-center justify-center gap-2 md:gap-4"
        >
          <span>
            <span className="text-farm-primary dark:text-farm-text-heading transition-colors">Adaptive Crop</span>{' '}
            <span className="text-farm-accent-orange transition-colors">Dashboard</span>
          </span>
        </motion.h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-farm-text-body font-lora text-sm md:text-lg italic"
        >
          Configure your soil parameters and get real-time AI recommendations
        </motion.p>
      </header>

      <div className="flex flex-col gap-6 md:gap-8 items-center w-full mx-auto">
        {/* Top Section - Bento Grid Inputs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full flex flex-col gap-6 md:gap-8"
        >
          {/* Controls (Bento Grid) */}
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
            cropCategory={cropCategory}
            setCropCategory={setCropCategory}
            targetCrop={targetCrop}
            setTargetCrop={setTargetCrop}
            language={language}
          />

          {/* Action Row: Simulator + Predict Button */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full">
            <Simulator
              baseRainfall={inputs.rainfall}
              reductionPercent={droughtReduction}
              onReductionChange={setDroughtReduction}
            />

            <div className="flex flex-col sm:flex-row gap-4 h-full w-full">
              <motion.button
                onClick={handlePredict}
                disabled={loading}
                whileHover={{ scale: loading ? 1 : 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="flex-1 h-full min-h-[120px] py-4 md:py-5 text-xl md:text-2xl flex justify-center items-center font-poppins rounded-3xl bg-gradient-to-br from-farm-accent-gold to-farm-accent-orange text-white dark:text-[#10190F] font-black shadow-[0_8px_32px_rgba(201,118,12,0.4)] hover:shadow-[0_16px_48px_rgba(201,118,12,0.6)] transition-all overflow-hidden relative group"
              >
                <div className="absolute inset-0 bg-white/20 transform -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-in-out" />
                {loading && <Loader2 className="w-8 h-8 animate-spin mr-4" />}
                <span className="flex items-center gap-3 relative z-10">
                  {loadingText} {!loading && <span className="text-3xl">🚀 {results ? "Re-run" : "Get AI Prediction"}</span>}
                </span>
              </motion.button>

              {results && (
                <motion.button
                  onClick={() => setResults(null)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="sm:w-1/3 h-full min-h-[120px] py-4 md:py-5 text-lg md:text-xl flex justify-center items-center font-poppins rounded-3xl bg-slate-100 dark:bg-black/30 text-slate-700 dark:text-slate-300 font-bold border-2 border-slate-300 dark:border-white/10 hover:border-red-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 dark:hover:border-red-500 dark:hover:text-red-400 transition-all"
                >
                  <span className="flex items-center gap-2">
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    Clear Results
                  </span>
                </motion.button>
              )}
            </div>
          </div>
        </motion.div>

        {/* Bottom Section - Results */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full flex flex-col gap-6"
        >
          {results ? (
            <div className="w-full flex flex-col gap-8 md:gap-10">

              {/* 1. Cropping Profile (Horizontal Stat Bar) */}
              <div className="glass-panel-refined p-4 md:p-6 bg-gradient-to-r from-farm-primary-light/10 to-transparent">
                <h3 className="text-lg md:text-xl font-bold font-poppins text-farm-primary mb-4 flex items-center gap-2">
                  <span className="text-2xl">📋</span> Current Status
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="flex items-center gap-3 bg-white/50 dark:bg-black/20 p-3 rounded-2xl border border-white/20 hover:bg-white/70 dark:hover:bg-white/10 transition-colors cursor-help group" title="Season determines day length and temperature baselines">
                    <div className="w-10 h-10 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center text-orange-600 dark:text-orange-400 group-hover:scale-110 transition-transform">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                    </div>
                    <div>
                      <div className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Season</div>
                      <div className="text-sm md:text-base font-semibold capitalize text-slate-800 dark:text-slate-200">{results.weatherUsed?.season || season || 'Auto'}</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 bg-white/50 dark:bg-black/20 p-3 rounded-2xl border border-white/20 hover:bg-white/70 dark:hover:bg-white/10 transition-colors cursor-help group" title="Irrigation status impacts root depth and drought resilience">
                    <div className="w-10 h-10 rounded-full bg-cyan-100 dark:bg-cyan-900/30 flex items-center justify-center text-cyan-600 dark:text-cyan-400 group-hover:scale-110 transition-transform">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>
                    </div>
                    <div>
                      <div className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Water</div>
                      <div className="text-sm md:text-base font-semibold capitalize text-slate-800 dark:text-slate-200">{isIrrigated ? 'Irrigated' : 'Rainfed'}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 bg-white/50 dark:bg-black/20 p-3 rounded-2xl border border-white/20 hover:bg-white/70 dark:hover:bg-white/10 transition-colors cursor-help group" title="Cropping style changes nutrient absorption rates">
                    <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
                    </div>
                    <div>
                      <div className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Style</div>
                      <div className="text-sm md:text-base font-semibold capitalize text-slate-800 dark:text-slate-200">{technique}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 bg-white/50 dark:bg-black/20 p-3 rounded-2xl border border-white/20 hover:bg-white/70 dark:hover:bg-white/10 transition-colors cursor-help group" title="Soil type affects drainage and pH buffering">
                    <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center text-amber-700 dark:text-amber-500 group-hover:scale-110 transition-transform">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" /></svg>
                    </div>
                    <div>
                      <div className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Soil Profile</div>
                      <div className="text-sm md:text-base font-semibold capitalize text-slate-800 dark:text-slate-200">{soilType || 'Mixed'}</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* 16-Day Weather Forecast */}
              {results.weatherUsed?.dailyForecast && (
                <section className="w-full">
                  <h3 className="text-xl md:text-2xl font-bold font-poppins text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                    <span className="text-3xl">🌤️</span> 16-Day Weather Forecast
                  </h3>
                  <div className="flex overflow-x-auto gap-3 md:gap-4 pb-4 snap-x">
                    {results.weatherUsed.dailyForecast.map((day, idx) => (
                      <div key={idx} className="snap-start shrink-0 w-28 md:w-32 bg-white dark:bg-[#1B2A17] p-3 md:p-4 rounded-2xl border border-slate-200 dark:border-white/10 shadow-sm flex flex-col items-center justify-center gap-2">
                        <span className="text-xs md:text-sm font-semibold text-slate-500 dark:text-slate-400">
                          {new Date(day.date).toLocaleDateString(localStorage.getItem('language') || 'en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                        </span>
                        <span className="text-3xl md:text-4xl my-1 md:my-2">{getWeatherEmoji(day.weatherCode)}</span>
                        <div className="flex gap-2 md:gap-3 text-sm font-bold font-mono">
                          <span className="text-red-500">{Math.round(day.maxTemp)}°</span>
                          <span className="text-blue-500">{Math.round(day.minTemp)}°</span>
                        </div>
                        <span className="text-xs font-semibold text-cyan-600 dark:text-cyan-400 mt-1 bg-cyan-50 dark:bg-cyan-900/30 px-2 py-0.5 rounded-full">
                          {day.precipitation > 0 ? `${day.precipitation}mm` : '0mm'}
                        </span>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* ML Predictions & Crop Analysis */}
              <section className="w-full">
                <ResultsCards
                  recommendedCrops={results.recommendedCrops}
                  avoidCrops={results.avoidCrops}
                  targetCropResult={results.targetCropResult}
                />
              </section>

              {/* 3. Pest & Disease Alerts (Actionable Cards) */}
              {results.alerts && results.alerts.length > 0 && (
                <section className="w-full">
                  <h3 className="text-xl md:text-2xl font-bold font-poppins text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                    <span className="text-3xl">🐛</span> Pest & Disease Risk
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {results.alerts.map((alert, idx) => (
                      <div key={idx} className={`p-5 rounded-3xl border-l-[6px] shadow-lg flex flex-col gap-3 ${alert.severity === 'high' ? 'bg-red-50 dark:bg-[#1F0F0F] border-red-500' : 'bg-amber-50 dark:bg-[#2B2212] border-amber-500'}`}>
                        <div className="flex items-center justify-between">
                          <span className={`font-bold text-lg md:text-xl ${alert.severity === 'high' ? 'text-red-800 dark:text-red-400' : 'text-amber-800 dark:text-amber-400'}`}>{alert.risk}</span>
                          <span className={`text-xs font-black px-4 py-1.5 rounded-full uppercase tracking-widest ${alert.severity === 'high' ? 'bg-red-500 text-white pulse-alert shadow-[0_0_15px_rgba(239,68,68,0.5)]' : 'bg-amber-500 text-white'}`}>
                            {alert.severity} RISK
                          </span>
                        </div>
                        
                        <div className="bg-white/60 dark:bg-black/20 p-4 rounded-xl border border-white/20 flex-grow">
                           <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Quick Actions</h4>
                           <ul className="text-sm leading-relaxed text-slate-700 dark:text-slate-300 space-y-2">
                             {/* Splitting message by periods to create checklist if it's long, otherwise just one item */}
                             {alert.message.split('. ').filter(s => s.trim().length > 0).map((step, i) => (
                               <li key={i} className="flex gap-2 items-start">
                                 <div className={`mt-0.5 rounded-full p-0.5 ${alert.severity === 'high' ? 'bg-red-200 text-red-600' : 'bg-amber-200 text-amber-600'}`}>
                                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                                 </div>
                                 <span>{step.endsWith('.') ? step : step + '.'}</span>
                               </li>
                             ))}
                           </ul>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* Action Buttons (AI & Govt Schemes) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 mt-4">
                <button
                  onClick={() => {
                    const toggle = () => { setShowAI(!showAI); setShowGovt(false); };
                    if (document.startViewTransition) {
                      document.startViewTransition(toggle);
                    } else {
                      toggle();
                    }
                    // Haptic feedback for mobile
                    if (navigator.vibrate) navigator.vibrate(10);
                  }}
                  className={`py-3 md:py-4 px-4 md:px-6 rounded-2xl font-bold text-base md:text-lg flex items-center justify-center gap-3 transition-all ${showAI ? 'bg-emerald-600 text-white shadow-inner shadow-black/20' : 'bg-white dark:bg-[#1B2A17] text-slate-800 dark:text-white border-2 border-emerald-500/30 hover:border-emerald-500 shadow-md'}`}
                >
                  <span className="flex items-center gap-2">
                    🤖 {showAI ? 'Hide AI Advice' : 'View AI Predictions & Advice'}
                  </span>
                </button>
                <button
                  onClick={() => {
                    const toggle = () => { setShowGovt(!showGovt); setShowAI(false); };
                    if (document.startViewTransition) {
                      document.startViewTransition(toggle);
                    } else {
                      toggle();
                    }
                    if (navigator.vibrate) navigator.vibrate(10);
                  }}
                  className={`py-3 md:py-4 px-4 md:px-6 rounded-2xl font-bold text-base md:text-lg flex items-center justify-center gap-3 transition-all ${showGovt ? 'bg-blue-600 text-white shadow-inner shadow-black/20' : 'bg-white dark:bg-[#1B2A17] text-slate-800 dark:text-white border-2 border-blue-500/30 hover:border-blue-500 shadow-md'}`}
                >
                  <span className="flex items-center gap-2">
                    🏛️ {showGovt ? 'Hide Govt Schemes' : 'View Govt Schemes'}
                  </span>
                </button>
              </div>

              {/* Toggled Sections */}
              {showAI && (
                <motion.section
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="w-full overflow-hidden"
                >
                  <h3 className="text-xl md:text-2xl font-bold font-poppins text-emerald-700 dark:text-emerald-400 mb-4 flex items-center gap-2">
                    Expert AI Insights
                  </h3>
                  <AIAdvice adviceText={results.aiAdvice} />
                </motion.section>
              )}

              {showGovt && (
                <motion.section
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="w-full overflow-hidden"
                >
                  <h3 className="text-xl md:text-2xl font-bold font-poppins text-blue-700 dark:text-blue-400 mb-4 flex items-center gap-2">
                    Government Schemes & Subsidies
                  </h3>
                  <GovernmentSchemes subsidyData={results.governmentSubsidies?.[0]} />
                </motion.section>
              )}

            </div>
          ) : (
            <div className="glass-panel h-full min-h-[250px] md:min-h-[400px] flex items-center justify-center text-slate-500 dark:text-slate-400 font-lora italic text-sm md:text-base">
              Run a prediction to see AI results here.
            </div>
          )}
        </motion.div>

      </div>
    </motion.div>
  );
};

export default Dashboard;
