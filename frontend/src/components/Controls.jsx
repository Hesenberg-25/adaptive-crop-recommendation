import React from 'react';
import { Droplets, Thermometer, FlaskConical, Wind, Leaf } from 'lucide-react';

const Controls = ({ values, onChange }) => {
  const sliders = [
    { name: 'Nitrogen (N)', key: 'N', min: 0, max: 140, icon: <Leaf className="w-5 h-5 text-emerald-400" /> },
    { name: 'Phosphorus (P)', key: 'P', min: 5, max: 145, icon: <Leaf className="w-5 h-5 text-emerald-400" /> },
    { name: 'Potassium (K)', key: 'K', min: 5, max: 205, icon: <Leaf className="w-5 h-5 text-emerald-400" /> },
    { name: 'Soil pH', key: 'pH', min: 3.5, max: 9.9, step: 0.1, icon: <FlaskConical className="w-5 h-5 text-purple-400" /> },
    { name: 'Temperature (°C)', key: 'temperature', min: 5, max: 45, icon: <Thermometer className="w-5 h-5 text-red-400" /> },
    { name: 'Humidity (%)', key: 'humidity', min: 10, max: 100, icon: <Wind className="w-5 h-5 text-blue-300" /> },
    { name: 'Rainfall (mm)', key: 'rainfall', min: 20, max: 300, icon: <Droplets className="w-5 h-5 text-blue-500" /> },
  ];

  return (
    <div className="glass-panel p-6 flex flex-col gap-4 w-full">
      <h2 className="text-xl font-semibold mb-2 flex items-center gap-2">
        <FlaskConical className="w-6 h-6 text-emerald-400" />
        Soil & Environmental Inputs
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {sliders.map((s) => (
          <div key={s.key} className="flex flex-col gap-2">
            <div className="flex justify-between items-center text-sm">
              <label className="flex items-center gap-2 text-slate-300">
                {s.icon} {s.name}
              </label>
              <span className="font-mono text-emerald-300 bg-emerald-900/30 px-2 py-1 rounded-md">
                {values[s.key] ?? s.min}
              </span>
            </div>
            <input
              type="range"
              min={s.min}
              max={s.max}
              step={s.step || 1}
              value={values[s.key] ?? s.min}
              onChange={(e) => onChange(s.key, parseFloat(e.target.value))}
              className="w-full accent-emerald-500 h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer"
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default Controls;
