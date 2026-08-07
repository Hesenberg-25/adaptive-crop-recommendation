import React, { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
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
  try { sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch {}
};
const loadState = () => {
  try { const s = sessionStorage.getItem(STORAGE_KEY); return s ? JSON.parse(s) : null; } catch { return null; }
};

const Dashboard = ({ externalUseLiveWeather, externalLocation, externalLocationName, language: langProp }) => {
  const { t, i18n } = useTranslation();
  const { token } = useAuth();
  const locationState = useLocation().state || {};
  const isJustLoggedIn = locationState.justLoggedIn;

  // Restore state from sessionStorage
  const saved = loadState();

  const [inputs, setInputs] = useState(saved?.inputs || {
    N: 90, P: 42, K: 43, pH: 6.5, temperature: 24, humidity: 82, rainfall: 220
  });
  const [droughtReduction, setDroughtReduction] = useState(saved?.droughtReduction || 0);
  
  // Location/weather — driven by TopBar via props
  const useLiveWeather = externalUseLiveWeather || false;
  const location = externalLocation || { lat: null, lon: null };
  const locationName = externalLocationName || '';
  const [loading, setLoading] = useState(false);
  const [loadingText, setLoadingText] = useState('run_prediction');
  const [results, setResults] = useState(saved?.results || null);
  const [season, setSeason] = useState(saved?.season || 'auto');
  const [isIrrigated, setIsIrrigated] = useState(saved?.isIrrigated || false);
  const [technique, setTechnique] = useState(saved?.technique || 'monocropping');
  const [soilType, setSoilType] = useState(saved?.soilType || '');
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
          if (!saved) {
            if (response.data.soil_type) setSoilType(response.data.soil_type);
            if (response.data.irrigation_type) setIsIrrigated(response.data.irrigation_type === 'irrigated');
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
      'initializing_ml',
      'running_knn',
      'calculating_shap',
      'scraping_market',
      'generating_report',
      'finalizing'
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
      toast.success(t('prediction_success', 'Prediction generated & saved to database!'));
    } catch (error) {
      clearInterval(intervalId);
      toast.error(error.response?.data?.error || t('prediction_failed', 'Failed to generate prediction'));
    } finally {
      setLoading(false);
      setLoadingText('run_prediction');
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
      className="container mx-auto px-3 md:px-4 max-w-[85rem] pb-28 md:pb-44"
    >
      <header className="mb-6 md:mb-10 text-center">
        <motion.h1 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-2xl md:text-4xl font-extrabold font-playfair mb-2 flex items-center justify-center gap-2 md:gap-4"
        >
          <span>
            <span className="text-farm-primary dark:text-farm-text-heading transition-colors">{t('adaptive_crop_rec', 'Adaptive Crop')}</span>{' '}
            <span className="text-farm-accent-orange transition-colors">{t('dashboard', 'Dashboard')}</span>
          </span>
        </motion.h1>
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-farm-text-body font-lora text-sm md:text-lg italic"
        >
          {t('configure_soil', 'Configure your soil parameters and get real-time AI recommendations')}
        </motion.p>
      </header>

      <div className="flex flex-col gap-6 md:gap-8 items-center w-full mx-auto">
        {/* Top Section - Inputs & Simulator Side-by-Side */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8"
        >
          {/* Left Column: Inputs */}
          <div className="flex flex-col gap-6">
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
          </div>

          {/* Right Column: Simulator then Predict Button */}
          <div className="flex flex-col gap-6">
            <Simulator 
              baseRainfall={inputs.rainfall} 
              reductionPercent={droughtReduction} 
              onReductionChange={setDroughtReduction} 
            />

            {/* ML Prediction Button — below Simulator */}
            <motion.button 
              onClick={handlePredict}
              disabled={loading}
              whileHover={{ scale: loading ? 1 : 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full py-4 md:py-5 text-lg md:text-xl flex justify-center items-center font-poppins relative overflow-hidden rounded-3xl bg-gradient-to-r from-farm-accent-gold to-farm-accent-orange text-white dark:text-[#10190F] font-bold shadow-[0_8px_32px_rgba(201,118,12,0.4)] hover:shadow-[0_8px_40px_rgba(201,118,12,0.6)] transition-all"
            >
              {loading && <Loader2 className="w-6 h-6 animate-spin mr-3" />}
              <span className="flex items-center gap-3">
                {t(loadingText)} {!loading && <span className="text-2xl">🚀</span>}
              </span>
            </motion.button>
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
              
              {/* Extra Data Card */}
              <div className="glass-panel p-4 md:p-6 bg-gradient-to-r from-farm-primary-light/10 to-transparent border-l-4 border-farm-primary">
                <h3 className="text-lg md:text-xl font-bold font-poppins text-farm-primary mb-4 flex items-center gap-2">
                  <span className="text-2xl">📋</span> {t('cropping_profile', 'Cropping Profile')}
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
                  <div className="bg-white/50 dark:bg-black/20 p-3 rounded-lg border border-white/20">
                    <div className="text-xs text-slate-500 uppercase font-bold">{t('season', 'Season')}</div>
                    <div className="text-base md:text-lg font-semibold capitalize text-slate-800 dark:text-slate-200">{results.weatherUsed?.season || season || 'Auto'}</div>
                  </div>
                  <div className="bg-white/50 dark:bg-black/20 p-3 rounded-lg border border-white/20">
                    <div className="text-xs text-slate-500 uppercase font-bold">{t('irrigation', 'Irrigation')}</div>
                    <div className="text-base md:text-lg font-semibold capitalize text-slate-800 dark:text-slate-200">{isIrrigated ? t('fully_irrigated', 'Irrigated') : t('rainfed', 'Rainfed')}</div>
                  </div>
                  <div className="bg-white/50 dark:bg-black/20 p-3 rounded-lg border border-white/20">
                    <div className="text-xs text-slate-500 uppercase font-bold">{t('technique', 'Style')}</div>
                    <div className="text-base md:text-lg font-semibold capitalize text-slate-800 dark:text-slate-200">{t(technique, technique)}</div>
                  </div>
                  <div className="bg-white/50 dark:bg-black/20 p-3 rounded-lg border border-white/20">
                    <div className="text-xs text-slate-500 uppercase font-bold">{t('soil_type', 'Soil Type')}</div>
                    <div className="text-base md:text-lg font-semibold capitalize text-slate-800 dark:text-slate-200">{soilType || t('mixed', 'Mixed')}</div>
                  </div>
                </div>
              </div>

              {/* 16-Day Weather Forecast */}
              {results.weatherUsed?.dailyForecast && (
                <section className="w-full">
                  <h3 className="text-xl md:text-2xl font-bold font-poppins text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                    <span className="text-3xl">🌤️</span> {t('weather_forecast', '16-Day Weather Forecast')}
                  </h3>
                  <div className="flex overflow-x-auto gap-3 md:gap-4 pb-4 snap-x">
                    {results.weatherUsed.dailyForecast.map((day, idx) => (
                      <div key={idx} className="snap-start shrink-0 w-28 md:w-32 bg-white dark:bg-[#1B2A17] p-3 md:p-4 rounded-2xl border border-slate-200 dark:border-white/10 shadow-sm flex flex-col items-center justify-center gap-2">
                        <span className="text-xs md:text-sm font-semibold text-slate-500 dark:text-slate-400">
                          {new Date(day.date).toLocaleDateString(i18n.language || 'en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
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
              
              {/* Pest & Disease Alerts */}
              {results.alerts && results.alerts.length > 0 && (
                <section className="w-full">
                  <h3 className="text-xl md:text-2xl font-bold font-poppins text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                    <span className="text-3xl">🐛</span> {t('pest_disease_risk', 'Pest & Disease Risk')}
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {results.alerts.map((alert, idx) => (
                      <div key={idx} className={`p-4 md:p-5 rounded-2xl border-l-4 shadow-md ${alert.severity === 'high' ? 'bg-red-50 dark:bg-[#2A1414] border-red-500' : 'bg-amber-50 dark:bg-[#2B2212] border-amber-500'}`}>
                        <div className="font-bold mb-3 flex items-center justify-between text-base md:text-lg">
                          <span className={alert.severity === 'high' ? 'text-red-800 dark:text-red-400' : 'text-amber-800 dark:text-amber-400'}>{alert.risk}</span>
                          <span className={`text-xs font-black px-3 py-1 rounded-full uppercase tracking-wider ${alert.severity === 'high' ? 'bg-red-200 text-red-900 dark:bg-red-900/50 dark:text-red-200' : 'bg-amber-200 text-amber-900 dark:bg-amber-900/50 dark:text-amber-200'}`}>
                            {alert.severity} {t('risk', 'RISK')}
                          </span>
                        </div>
                        <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-300">
                          {alert.message}
                        </p>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* Action Buttons (AI & Govt Schemes) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 mt-4">
                <button 
                  onClick={() => { setShowAI(!showAI); setShowGovt(false); }}
                  className={`py-3 md:py-4 px-4 md:px-6 rounded-2xl font-bold text-base md:text-lg flex items-center justify-center gap-3 transition-all ${showAI ? 'bg-emerald-600 text-white shadow-inner shadow-black/20' : 'bg-white dark:bg-[#1B2A17] text-slate-800 dark:text-white border-2 border-emerald-500/30 hover:border-emerald-500 shadow-md'}`}
                >
                  <span className="flex items-center gap-2">
                    🤖 {showAI ? t('hide_ai_advice', 'Hide AI Advice') : t('view_ai_predictions', 'View AI Predictions & Advice')}
                  </span>
                </button>
                <button 
                  onClick={() => { setShowGovt(!showGovt); setShowAI(false); }}
                  className={`py-3 md:py-4 px-4 md:px-6 rounded-2xl font-bold text-base md:text-lg flex items-center justify-center gap-3 transition-all ${showGovt ? 'bg-blue-600 text-white shadow-inner shadow-black/20' : 'bg-white dark:bg-[#1B2A17] text-slate-800 dark:text-white border-2 border-blue-500/30 hover:border-blue-500 shadow-md'}`}
                >
                  <span className="flex items-center gap-2">
                    🏛️ {showGovt ? t('hide_govt_schemes', 'Hide Govt Schemes') : t('view_govt_schemes', 'View Govt Schemes')}
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
                    {t('expert_ai_insights', 'Expert AI Insights')}
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
                    {t('government_schemes', 'Government Schemes & Subsidies')}
                  </h3>
                  <GovernmentSchemes subsidyData={results.governmentSubsidies?.[0]} />
                </motion.section>
              )}

            </div>
          ) : (
            <div className="glass-panel h-full min-h-[250px] md:min-h-[400px] flex items-center justify-center text-slate-500 dark:text-slate-400 font-lora italic text-sm md:text-base">
              {t('run_prediction_hint', 'Run a prediction to see AI results here.')}
            </div>
          )}
        </motion.div>

      </div>
    </motion.div>
  );
};

export default Dashboard;
