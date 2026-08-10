import React, { useState } from 'react';
import { Droplets, Thermometer, FlaskConical, Wind, Leaf, Map, Calendar, Droplet, CheckCircle2, Camera, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Tooltip from './Tooltip';
import CustomSelect from './CustomSelect';
import VoiceInput from './VoiceInput';
import ScanSoilModal from './ScanSoilModal';


const Controls = ({ values, onChange, useLiveWeather, season, setSeason, isIrrigated, setIsIrrigated, technique, setTechnique, soilType, setSoilType, cropCategory, setCropCategory, targetCrop, setTargetCrop, language }) => {
  const [isScanning, setIsScanning] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const sliders = [
    { 
      name: 'Nitrogen (N) (mg/kg)', key: 'N', min: 0, max: 140, 
      icon: <Leaf className="w-5 h-5 text-emerald-500 dark:text-emerald-400" />,
      tooltip: "Measured in mg/kg. Crucial for leaf growth and vibrant green color."
    },
    { 
      name: 'Phosphorus (P) (mg/kg)', key: 'P', min: 5, max: 145, 
      icon: <Leaf className="w-5 h-5 text-emerald-500 dark:text-emerald-400" />,
      tooltip: "Measured in mg/kg. Essential for strong root development and flower/fruit production."
    },
    { 
      name: 'Potassium (K) (mg/kg)', key: 'K', min: 5, max: 205, 
      icon: <Leaf className="w-5 h-5 text-emerald-500 dark:text-emerald-400" />,
      tooltip: "Measured in mg/kg. Vital for overall plant health, drought resistance, and disease immunity."
    },
    { 
      name: 'Soil pH', key: 'pH', min: 3.5, max: 9.9, step: 0.1, 
      icon: <FlaskConical className="w-5 h-5 text-purple-500 dark:text-purple-400" />,
      tooltip: "Measures soil acidity. < 7 is acidic, 7 is neutral, > 7 is alkaline. Most crops prefer 6.0-7.5."
    },
    { 
      name: 'Temperature (°C)', key: 'temperature', min: 5, max: 45, 
      icon: <Thermometer className="w-5 h-5 text-red-500 dark:text-red-400" />,
      tooltip: "Ambient temperature in Celsius. Locks automatically when 'Use Live Weather' is on."
    },
    { 
      name: 'Humidity (%)', key: 'humidity', min: 10, max: 100, 
      icon: <Wind className="w-5 h-5 text-blue-400 dark:text-blue-300" />,
      tooltip: "Relative air humidity percentage. Locks automatically when 'Use Live Weather' is on."
    },
    { 
      name: 'Rainfall (mm)', key: 'rainfall', min: 20, max: 300, 
      icon: <Droplets className="w-5 h-5 text-blue-600 dark:text-blue-500" />,
      tooltip: "Total rainfall in millimeters. Locks automatically when 'Use Live Weather' is on."
    },
  ];

  const isWeatherKey = (key) => ['temperature', 'humidity', 'rainfall'].includes(key);

  const soilOptions = [
    { value: "alluvial", label: "Alluvial (Northern Plains)" },
    { value: "black", label: "Black / Regur (Deccan)" },
    { value: "red", label: "Red / Yellow (Eastern)" },
    { value: "laterite", label: "Laterite (Western Ghats)" },
    { value: "arid", label: "Arid / Desert (Sandy)" },
    { value: "mountain", label: "Mountain / Forest (Hilly)" },
    { value: "saline", label: "Saline / Alkaline (Coastal)" },
    { value: "peaty", label: "Peaty / Marshy (Organic)" },
  ];

  const categoryOptions = [
    { value: "Cereals & Grains", label: "Cereals & Grains" },
    { value: "Pulses & Beans", label: "Pulses & Beans" },
    { value: "Vegetables", label: "Vegetables" },
    { value: "Fruits", label: "Fruits" },
    { value: "Cash Crops & Others", label: "Cash Crops & Others" }
  ];

  const categoryToCrops = {
    "Cereals & Grains": ["wheat", "rice", "maize", "millet"],
    "Pulses & Beans": ["chickpea", "kidneybeans", "pigeonpeas", "mothbeans", "mungbean", "blackgram", "lentil"],
    "Vegetables": ["carrot", "tomato", "potato"],
    "Fruits": ["pomegranate", "banana", "mango", "grapes", "watermelon", "muskmelon", "apple", "orange", "papaya", "coconut"],
    "Cash Crops & Others": ["cotton", "sugarcane", "jute", "coffee", "soybean", "mustard"]
  };

  const cropOptions = cropCategory && categoryToCrops[cropCategory] 
    ? categoryToCrops[cropCategory].map(c => ({ value: c, label: c.charAt(0).toUpperCase() + c.slice(1) }))
    : [];

  const handleSoilTypeChange = (e) => {
    const type = e.target.value;
    if (setSoilType) setSoilType(type);
    const baselines = {
      alluvial:  { N: 60,  P: 40, K: 40, pH: 7.0 },  // Fertile river-deposited soil, neutral pH
      black:     { N: 40,  P: 40, K: 60, pH: 7.8 },  // High clay, moisture-retentive, slightly alkaline
      red:       { N: 30,  P: 30, K: 40, pH: 6.0 },  // Iron-rich, slightly acidic, low fertility
      laterite:  { N: 20,  P: 20, K: 20, pH: 5.0 },  // Heavily leached, acidic, low nutrients
      arid:      { N: 15,  P: 15, K: 30, pH: 8.2 },  // Sandy, alkaline, very low organic matter
      mountain:  { N: 50,  P: 35, K: 35, pH: 5.5 },  // Rich humus, acidic, moderate fertility
      saline:    { N: 25,  P: 20, K: 45, pH: 8.5 },  // High salt, strongly alkaline, stressed crops
      peaty:     { N: 70,  P: 15, K: 25, pH: 4.5 },  // Very high organic matter, acidic, waterlogged
    };
    
    if (baselines[type]) {
       onChange('N', baselines[type].N);
       onChange('P', baselines[type].P);
       onChange('K', baselines[type].K);
       onChange('pH', baselines[type].pH);
    }
  };


  const handleVoiceResult = (extracted) => {
    Object.entries(extracted).forEach(([key, val]) => {
      if (val !== undefined && val !== null) onChange(key, val);
    });
  };

  const handleScanSoil = () => {
    setIsModalOpen(true);
  };

  const handleScanComplete = (data) => {
    // We expect { N, P, K, pH, soilType }
    if (data.soilType) {
      // Find the closest matching option or just lowercase it
      const types = ['black', 'red', 'alluvial', 'laterite', 'sandy', 'loamy', 'clay'];
      let matchedType = types.find(t => data.soilType.toLowerCase().includes(t));
      if (matchedType) setSoilType(matchedType);
    }
    if (data.N !== undefined) onChange('N', parseFloat(data.N));
    if (data.P !== undefined) onChange('P', parseFloat(data.P));
    if (data.K !== undefined) onChange('K', parseFloat(data.K));
    if (data.pH !== undefined) onChange('pH', parseFloat(data.pH));
  };

  return (
    <div className="w-full flex flex-col gap-4">
      {/* 1. Top Section: AI Inputs (Voice & Vision) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2 glass-panel p-4 flex items-center bg-white/40 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-3xl">
          <VoiceInput 
            onValuesExtracted={handleVoiceResult} 
            placeholder='Describe your farm, e.g. "high nitrogen, very hot"'
            language={language}
          />
        </div>
        <button
          onClick={handleScanSoil}
          disabled={isScanning}
          className="md:col-span-1 glass-panel p-4 flex items-center justify-center gap-3 bg-gradient-to-r from-emerald-500/10 to-teal-500/10 hover:from-emerald-500/20 hover:to-teal-500/20 border border-emerald-500/30 rounded-3xl transition-all group"
        >
          {isScanning ? (
            <Loader2 className="w-6 h-6 text-emerald-600 animate-spin" />
          ) : (
            <Camera className="w-6 h-6 text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform" />
          )}
          <span className="font-bold text-emerald-700 dark:text-emerald-300">
            {isScanning ? "Scanning Soil..." : "AI Scan Soil"}
          </span>
        </button>
      </div>

      <ScanSoilModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onScanComplete={handleScanComplete} 
      />

      {/* 2. Context Box (Dropdowns) - Moved ABOVE NPK inputs */}
      <div className="glass-panel p-6 rounded-3xl border border-slate-200 dark:border-white/10 bg-white/40 dark:bg-black/20 relative z-50">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
          <CustomSelect value={soilType || ""} onChange={(val) => handleSoilTypeChange({ target: { value: val } })} placeholder="Soil Profile" icon={<Map className="w-4 h-4 text-emerald-500" />} options={soilOptions} />
          <CustomSelect value={season} onChange={setSeason} placeholder="Season" icon={<Calendar className="w-4 h-4 text-emerald-500" />} options={[{ value: "auto", label: "Auto" }, { value: "kharif", label: "Kharif" }, { value: "rabi", label: "Rabi" }, { value: "zaid", label: "Zaid" }]} />
          <CustomSelect value={isIrrigated ? 'irrigated' : 'rainfed'} onChange={(val) => setIsIrrigated(val === 'irrigated')} placeholder="Irrigation" icon={<Droplet className="w-4 h-4 text-emerald-500" />} options={[{ value: "rainfed", label: "Rainfed" }, { value: "irrigated", label: "Irrigated" }]} />
          <CustomSelect value={technique} onChange={setTechnique} placeholder="Technique" icon={<Leaf className="w-4 h-4 text-emerald-500" />} options={[{ value: "monocropping", label: "Monocrop" }, { value: "intercropping", label: "Intercrop" }, { value: "strip", label: "Strip" }, { value: "mixed", label: "Mixed" }]} />
          <CustomSelect value={cropCategory} onChange={(val) => { setCropCategory(val); setTargetCrop(''); }} placeholder="Category" icon={<Leaf className="w-4 h-4 text-emerald-500" />} options={categoryOptions} />
        </div>
      </div>

      {/* 3. Bento Grid for Sliders */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Nutrients Box */}
        <div className="glass-panel p-6 rounded-3xl border border-slate-200 dark:border-white/10 bg-white/40 dark:bg-black/20 flex flex-col gap-5">
          <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2 mb-2">
            <Leaf className="w-5 h-5 text-emerald-500" /> Soil Nutrients
          </h3>
          {sliders.filter(s => ['N', 'P', 'K'].includes(s.key)).map(s => (
            <SliderRow key={s.key} s={s} values={values} onChange={onChange} locked={false} trackGradient='linear-gradient(to right, #A8C98A, #4A7C3A)' />
          ))}
        </div>

        {/* Environment Box */}
        <div className="glass-panel p-6 rounded-3xl border border-slate-200 dark:border-white/10 bg-white/40 dark:bg-black/20 flex flex-col gap-5">
          <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2 mb-2">
            <Wind className="w-5 h-5 text-blue-500" /> Environment & pH
          </h3>
          {sliders.filter(s => !['N', 'P', 'K'].includes(s.key)).map(s => {
            const locked = useLiveWeather && isWeatherKey(s.key);
            const isPH = s.key === 'pH';
            const trackGradient = isPH ? 'linear-gradient(to right, #E8A33D, #B23A1D)' : '#E8DCC0';
            return <SliderRow key={s.key} s={s} values={values} onChange={onChange} locked={locked} trackGradient={trackGradient} />;
          })}
        </div>
      </div>

    </div>
  );
};

// Extracted small component for slider rows
const SliderRow = ({ s, values, onChange, locked, trackGradient }) => (
  <div className={`flex flex-col gap-2 relative ${locked ? 'opacity-60' : ''}`}>
    <div className="flex justify-between items-center text-sm">
      <label className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300 font-medium font-inter">
        {s.name.split(' ')[0]} {/* Simplified name */}
        {s.tooltip && <Tooltip text={s.tooltip} align="center" />}
      </label>
      <span className="font-extrabold text-slate-900 dark:text-white transition-colors text-base font-poppins">
        {locked ? 'Live' : (values[s.key] ?? s.min)}
      </span>
    </div>
    <input
      type="range" min={s.min} max={s.max} step={s.step || 1}
      value={values[s.key] ?? s.min} onChange={(e) => onChange(s.key, parseFloat(e.target.value))}
      disabled={locked}
      className={`w-full h-2 rounded-lg custom-range-slider transition-colors ${locked ? 'cursor-not-allowed' : 'cursor-pointer'}`}
      style={{ background: trackGradient }}
    />
  </div>
);

export default Controls;
