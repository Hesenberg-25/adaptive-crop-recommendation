import React from 'react';
import { Droplets, Thermometer, FlaskConical, Wind, Leaf, Map, Calendar, Droplet, CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';
import Tooltip from './Tooltip';
import CustomSelect from './CustomSelect';
import VoiceInput from './VoiceInput';
import { useTranslation } from 'react-i18next';

const Controls = ({ values, onChange, useLiveWeather, season, setSeason, isIrrigated, setIsIrrigated, technique, setTechnique, soilType, setSoilType, cropCategory, setCropCategory, targetCrop, setTargetCrop, language }) => {
  const { t } = useTranslation();
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
    { value: "alluvial", label: "Alluvial (Northern)" },
    { value: "black", label: "Black (Deccan)" },
    { value: "red", label: "Red (East)" },
    { value: "laterite", label: "Laterite (Ghats)" }
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
      alluvial: { N: 60, P: 40, K: 40, pH: 7.0 },
      black: { N: 40, P: 40, K: 60, pH: 7.8 },
      red: { N: 30, P: 30, K: 40, pH: 6.0 },
      laterite: { N: 20, P: 20, K: 20, pH: 5.0 }
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

  return (
    <div className="glass-panel flex flex-col w-full relative overflow-hidden">
      <div className="bg-gradient-to-r from-[#2B1B12] to-[#4A3221] dark:from-[#0F0A07] dark:to-[#2B1B12] px-6 py-4 flex justify-between items-center transition-colors">
        <h2 className="text-xl font-semibold flex items-center gap-2 text-white">
          <FlaskConical className="w-6 h-6 text-farm-accent-gold" />
          {t('soil_inputs', 'Soil & Environmental Inputs')}
        </h2>
        <div className="text-white/80">
          <Tooltip text={t('adjust_hint', 'Adjust the chemical and environmental parameters. Live Weather automatically syncs historical climate data for the selected season.')} align="right" />
        </div>
      </div>
      
      <div className="p-6 flex flex-col gap-6">
        <VoiceInput 
          onValuesExtracted={handleVoiceResult} 
          placeholder={t('tap_mic', 'Tap the mic and describe your soil, e.g. "high nitrogen and very hot today"')}
          language={language}
        />

        <div className="flex flex-col gap-4 mb-2">
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 w-full">
          <CustomSelect 
            value={soilType || ""}
            onChange={(val) => handleSoilTypeChange({ target: { value: val } })}
            placeholder={t('soil_profile', "Soil Profile...")}
            icon={<Map className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />}
            options={soilOptions}
          />

          <CustomSelect 
            value={season}
            onChange={(val) => setSeason(val)}
            placeholder={t('season', "Season...")}
            icon={<Calendar className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />}
            options={[
              { value: "auto", label: t('auto_current_date', "Auto (Current Date)") },
              { value: "kharif", label: t('kharif', "Kharif (Monsoon)") },
              { value: "rabi", label: t('rabi', "Rabi (Winter)") },
              { value: "zaid", label: t('zaid', "Zaid (Summer)") }
            ]}
          />

          <CustomSelect 
            value={isIrrigated ? 'irrigated' : 'rainfed'}
            onChange={(val) => setIsIrrigated(val === 'irrigated')}
            placeholder={t('irrigation', "Irrigation...")}
            icon={<Droplet className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />}
            options={[
              { value: "rainfed", label: t('rainfed', "Rainfed") },
              { value: "irrigated", label: t('fully_irrigated', "Fully Irrigated") }
            ]}
          />

          <CustomSelect 
            value={technique}
            onChange={(val) => setTechnique(val)}
            placeholder={t('technique', "Technique...")}
            icon={<Leaf className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />}
            options={[
              { value: "monocropping", label: t('monocropping', "Monocropping") },
              { value: "intercropping", label: t('intercropping', "Intercropping") },
              { value: "strip", label: t('strip_cropping', "Strip Cropping") },
              { value: "mixed", label: t('mixed_cropping', "Mixed Cropping") }
            ]}
          />

          <CustomSelect 
            value={cropCategory}
            onChange={(val) => {
              setCropCategory(val);
              setTargetCrop('');
            }}
            placeholder={t('target_category', "Target Category (Optional)...")}
            icon={<Leaf className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />}
            options={categoryOptions}
          />

          <CustomSelect 
            value={targetCrop}
            onChange={(val) => setTargetCrop(val)}
            placeholder={t('target_crop', "Target Crop...")}
            icon={<CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />}
            options={cropOptions}
          />
        </div>

        {soilType && (
          <motion.div 
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full mt-1 p-3 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg flex items-center gap-2 text-emerald-800 dark:text-emerald-200 text-sm shadow-sm"
          >
            <CheckCircle2 className="w-5 h-5 shrink-0" />
            <span>{t('selected_soil', 'Selected Soil Profile')}: <strong className="font-semibold">{soilOptions.find(o => o.value === soilType)?.label || soilType}</strong></span>
          </motion.div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {sliders.map((s) => {
          const locked = useLiveWeather && isWeatherKey(s.key);
          const isNPK = ['N', 'P', 'K'].includes(s.key);
          const isPH = s.key === 'pH';
          const trackGradient = isNPK ? 'linear-gradient(to right, #A8C98A, #4A7C3A)' : isPH ? 'linear-gradient(to right, #E8A33D, #B23A1D)' : '#E8DCC0';

          return (
            <div key={s.key} className={`flex flex-col gap-2 relative ${locked ? 'opacity-60' : ''}`}>
              <div className="flex justify-between items-center text-sm">
                <label className="flex items-center gap-2 text-farm-text-body font-medium">
                  {s.icon} {s.name}
                  {s.tooltip && <Tooltip text={s.tooltip} align="center" />}
                </label>
                <span className="font-bold text-farm-primary dark:text-farm-accent-gold transition-colors text-lg">
                  {locked ? t('live', 'Live') : (values[s.key] ?? s.min)}
                </span>
              </div>
              <input
                type="range"
                min={s.min}
                max={s.max}
                step={s.step || 1}
                value={values[s.key] ?? s.min}
                onChange={(e) => onChange(s.key, parseFloat(e.target.value))}
                disabled={locked}
                className={`w-full h-2 rounded-lg custom-range-slider transition-colors ${locked ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                style={{ background: trackGradient }}
              />
            </div>
          );
        })}
      </div>
    </div>
  </div>
  );
};

export default Controls;
