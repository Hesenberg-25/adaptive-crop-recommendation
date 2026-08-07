import React from 'react';
import { CloudRain, Zap } from 'lucide-react';
import { motion } from 'framer-motion';
import Tooltip from './Tooltip';
import { useTranslation } from 'react-i18next';

const Simulator = ({ baseRainfall, reductionPercent, onReductionChange }) => {
  const { t } = useTranslation();
  const simulatedRainfall = baseRainfall * (1 - reductionPercent / 100);

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="glass-panel p-6 flex flex-col gap-4 w-full border-red-500/30"
    >
      <h2 className="text-xl font-semibold mb-2 flex items-center gap-2 text-red-500 dark:text-red-400">
        <Zap className="w-6 h-6" />
        {t('what_if_drought', '"What-If?" Drought Simulator')}
        <Tooltip text="Simulates drought conditions by intercepting the base rainfall (live or manual) and applying a percentage reduction before sending it to the ML model." align="right" />
      </h2>
      <p className="text-sm text-slate-600 dark:text-slate-300">
        {t('dynamically_reduce', 'Dynamically reduce rainfall to see how the model adapts to drought conditions in real-time.')}
      </p>
      
      <div className="flex flex-col gap-2 mt-4">
        <div className="flex justify-between items-center text-sm">
          <label className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
            <CloudRain className="w-5 h-5 text-blue-500 dark:text-blue-400" /> {t('rainfall_reduction', 'Rainfall Reduction')}
          </label>
          <span className="font-mono text-red-700 dark:text-red-300 bg-red-100 dark:bg-red-900/30 px-2 py-1 rounded-md transition-colors">
            -{reductionPercent}%
          </span>
        </div>
        
        <input
          type="range"
          min="0"
          max="50"
          step="5"
          value={reductionPercent}
          onChange={(e) => onReductionChange(parseInt(e.target.value))}
          className="w-full accent-red-500 h-2 bg-slate-300 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer transition-colors"
        />
        
        <div className="mt-4 flex justify-between items-center bg-slate-100 dark:bg-black/20 p-3 rounded-lg border border-slate-300 dark:border-white/5 transition-colors">
          <span className="text-slate-500 dark:text-slate-400 text-sm">{t('effective_rainfall', 'Effective Rainfall:')}</span>
          <span className="text-xl font-bold text-blue-600 dark:text-blue-300">{simulatedRainfall.toFixed(1)} mm</span>
        </div>
      </div>
    </motion.div>
  );
};

export default Simulator;
