import React from 'react';
import { Droplets, Thermometer, FlaskConical, Wind, Leaf, CloudLightning } from 'lucide-react';
import Tooltip from './Tooltip';

const Controls = ({ values, onChange, useLiveWeather }) => {
  const sliders = [
    { 
      name: 'Nitrogen (N)', key: 'N', min: 0, max: 140, 
      icon: <Leaf className="w-5 h-5 text-emerald-500 dark:text-emerald-400" />,
      tooltip: "Measured in mg/kg. Crucial for leaf growth and vibrant green color."
    },
    { 
      name: 'Phosphorus (P)', key: 'P', min: 5, max: 145, 
      icon: <Leaf className="w-5 h-5 text-emerald-500 dark:text-emerald-400" />,
      tooltip: "Measured in mg/kg. Essential for strong root development and flower/fruit production."
    },
    { 
      name: 'Potassium (K)', key: 'K', min: 5, max: 205, 
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

  return (
    <div className="glass-panel p-6 flex flex-col gap-4 w-full relative">
      <h2 className="text-xl font-semibold mb-2 flex items-center gap-2 text-slate-800 dark:text-slate-100">
        <FlaskConical className="w-6 h-6 text-emerald-500 dark:text-emerald-400" />
        Soil & Environmental Inputs
        <Tooltip text="Adjust the chemical and environmental parameters of your soil. If 'Use Live Weather' is enabled, the weather parameters are automatically locked and synced with your location." align="right" />
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {sliders.map((s) => {
          const locked = useLiveWeather && isWeatherKey(s.key);
          return (
            <div key={s.key} className={`flex flex-col gap-2 relative ${locked ? 'opacity-60' : ''}`}>
              <div className="flex justify-between items-center text-sm">
                <label className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                  {s.icon} {s.name}
                  {s.tooltip && <Tooltip text={s.tooltip} align="center" />}
                </label>
                <span className="font-mono text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-900/30 px-2 py-1 rounded-md transition-colors">
                  {locked ? 'Live' : (values[s.key] ?? s.min)}
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
                className={`w-full accent-emerald-500 h-2 bg-slate-300 dark:bg-slate-700 rounded-lg appearance-none transition-colors ${locked ? 'cursor-not-allowed' : 'cursor-pointer'}`}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Controls;
