import React, { useState } from 'react';
import Tooltip from '../components/Tooltip';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import { Loader2, MapPin, HelpCircle } from 'lucide-react';
import Controls from '../components/Controls';
import Simulator from '../components/Simulator';
import ResultsCards from '../components/ResultsCards';
import Financials from '../components/Financials';
import GovernmentSchemes from '../components/GovernmentSchemes';
import AIAdvice from '../components/AIAdvice';
import { useAuth } from '../context/AuthContext';

import axios from 'axios';

const Dashboard = () => {
  const { token } = useAuth();
  const [inputs, setInputs] = useState({
    N: 90, P: 42, K: 43, pH: 6.5, temperature: 24, humidity: 82, rainfall: 220
  });
  const [droughtReduction, setDroughtReduction] = useState(0);
  
  const [useLiveWeather, setUseLiveWeather] = useState(false);
  const [location, setLocation] = useState({ lat: null, lon: null });
  const [locationName, setLocationName] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);

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
        (error) => {
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
    try {
      const payload = {
        ...inputs,
        rainfall: inputs.rainfall * (1 - droughtReduction / 100),
        useLiveWeather,
        lat: location.lat,
        lon: location.lon
      };
      
      const response = await axios.post('http://localhost:5000/api/predict', payload, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setResults(response.data);
      toast.success('Prediction generated & saved to database!');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to generate prediction');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 max-w-6xl pb-12">
      <header className="mb-10 text-center">
        <motion.h1 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-4xl font-extrabold font-playfair text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400 mb-2"
        >
          Adaptive Crop Dashboard
        </motion.h1>
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-slate-500 dark:text-slate-400 font-lora text-lg italic"
        >
          Configure your soil parameters and get real-time AI recommendations
        </motion.p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column - Inputs */}
        <motion.div 
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          className="lg:col-span-5 flex flex-col gap-6"
        >
          <div className="glass-panel p-4 flex justify-between items-center">
            <div className="flex items-center gap-2 text-slate-800 dark:text-slate-100 font-medium">
              <MapPin className="w-5 h-5 text-emerald-500" />
              Use Live Weather
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" checked={useLiveWeather} onChange={toggleLiveWeather} />
              <div className="w-11 h-6 bg-slate-300 dark:bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
            </label>
          </div>

          <Controls values={inputs} onChange={handleInputChange} useLiveWeather={useLiveWeather} />
          
          <Simulator 
            baseRainfall={inputs.rainfall} 
            reductionPercent={droughtReduction} 
            onReductionChange={setDroughtReduction} 
          />
          
          <button 
            onClick={handlePredict}
            disabled={loading}
            className="glass-button w-full py-4 text-lg flex justify-center items-center mt-2 font-poppins"
          >
            {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : 'Run AI Prediction'}
          </button>
        </motion.div>

        {/* Right Column - Results */}
        <motion.div 
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          className="lg:col-span-7 flex flex-col gap-6"
        >
          {results ? (
            <>
              {results.weatherUsed && (
                <div className="glass-panel p-4 text-sm text-slate-600 dark:text-slate-300 bg-emerald-500/10 border-emerald-500/30">
                  <span className="font-semibold text-emerald-700 dark:text-emerald-400">Model Input Weather:</span> 
                  {' '}{results.weatherUsed.temperature.toFixed(1)}°C, 
                  {' '}{results.weatherUsed.humidity.toFixed(1)}% Humidity, 
                  {' '}{results.weatherUsed.rainfall.toFixed(1)}mm Rainfall.
                  {useLiveWeather && (
                    <div className="mt-1 text-xs font-semibold text-emerald-800 dark:text-emerald-300">
                      📍 Geolocation: {locationName || 'Fetching...'}
                    </div>
                  )}
                </div>
              )}
              <div className="flex flex-col gap-8">
                <section>
                  <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-300 mb-3 ml-2 font-poppins flex items-center">
                    ML Predictions
                    <Tooltip text="Analyzes your exact NPK, pH, and Weather data through our classification model to determine the crops with the highest probability of survival." />
                  </h3>
                  <ResultsCards predictions={results.topCrops} />
                </section>
                
                <section>
                  <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-300 mb-3 ml-2 font-poppins flex items-center">
                    Financial Analysis
                    <Tooltip text="Calculates Estimated ROI by cross-referencing the predicted crop yield with live market prices and average cultivation costs." />
                  </h3>
                  <Financials financialData={results.roiCalculations[0]} />
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
      </div>
    </div>
  );
};

export default Dashboard;
