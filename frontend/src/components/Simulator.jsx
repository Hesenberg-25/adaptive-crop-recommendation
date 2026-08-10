import React from 'react';
import { CloudRain, Zap } from 'lucide-react';
import { motion } from 'framer-motion';
import Tooltip from './Tooltip';


const Simulator = ({ baseRainfall, reductionPercent, onReductionChange }) => {
  const simulatedRainfall = baseRainfall * (1 - reductionPercent / 100);

  // Calculate color from Emerald (10, 166, 87) to Red (239, 68, 68) based on reduction (0 to 50)
  const ratio = reductionPercent / 50;
  const r = Math.round(16 + ratio * (239 - 16));
  const g = Math.round(185 - ratio * (185 - 68));
  const b = Math.round(129 - ratio * (129 - 68));
  const droughtColor = `rgb(${r}, ${g}, ${b})`;

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="glass-panel p-6 flex flex-col gap-4 w-full transition-colors duration-300"
      style={{ borderColor: `rgba(${r}, ${g}, ${b}, 0.4)` }}
    >
      <h2 className="text-xl font-semibold mb-2 flex items-center gap-2 text-red-500 dark:text-red-400">
        <Zap className="w-6 h-6" />
        "What-If?" Drought Simulator
        <Tooltip text="Simulates drought conditions by intercepting the base rainfall (live or manual) and applying a percentage reduction before sending it to the ML model." align="right" />
      </h2>
      <p className="text-sm text-slate-600 dark:text-slate-300">
        Dynamically reduce rainfall to see how the model adapts to drought conditions in real-time.
      </p>
      
      <div className="flex flex-col gap-2 mt-4">
        <div className="flex justify-between items-center text-sm">
          <label className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
            <CloudRain className="w-5 h-5 text-blue-500 dark:text-blue-400" /> Rainfall Reduction
          </label>
          <span 
            className="font-mono px-2 py-1 rounded-md transition-colors font-bold text-white shadow-sm"
            style={{ backgroundColor: droughtColor }}
          >
            -{reductionPercent}%
          </span>
        </div>
        
        <input
          type="range"
          min="0"
          max="50"
          step="1"
          value={reductionPercent}
          onChange={(e) => {
            onReductionChange(parseInt(e.target.value));
            if (navigator.vibrate) navigator.vibrate(10); // Haptic feedback
          }}
          className="w-full h-2 rounded-lg appearance-none cursor-pointer transition-colors"
          style={{ background: `linear-gradient(to right, #10b981, ${droughtColor} ${reductionPercent * 2}%, #334155)` }}
        />
        
        <div className="mt-4 flex justify-between items-center bg-slate-100 dark:bg-black/20 p-3 rounded-lg border border-slate-300 dark:border-white/5 transition-colors">
          <span className="text-slate-500 dark:text-slate-400 text-sm">Effective Rainfall:</span>
          <span className="text-xl font-bold text-blue-600 dark:text-blue-300">{simulatedRainfall.toFixed(1)} mm</span>
        </div>
      </div>
    </motion.div>
  );
};

export default Simulator;
