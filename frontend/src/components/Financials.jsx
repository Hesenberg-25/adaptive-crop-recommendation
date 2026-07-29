import React from 'react';
import { IndianRupee, TrendingUp, Pickaxe } from 'lucide-react';
import { motion } from 'framer-motion';

const Financials = ({ financialData }) => {
  if (!financialData) {
    return null;
  }

  // Handle strings vs numbers for ROI since backend sends "80.00%"
  const roiValue = typeof financialData.roi === 'string' 
    ? parseFloat(financialData.roi.replace('%', '')) 
    : financialData.roi;

  const roiColor = roiValue > 50 
    ? 'text-emerald-500 dark:text-emerald-400' 
    : roiValue > 0 
      ? 'text-amber-500 dark:text-amber-400' 
      : 'text-red-500 dark:text-red-400';

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="glass-panel p-6 flex flex-col gap-4 w-full"
    >
      <h2 className="text-xl font-semibold mb-2 flex items-center gap-2 text-blue-500 dark:text-blue-400">
        <IndianRupee className="w-6 h-6" />
        Financial Feasibility & ROI
      </h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
        <div className="bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 p-4 rounded-xl flex flex-col gap-1 transition-colors">
          <span className="text-sm text-slate-500 dark:text-slate-400 flex items-center gap-1">
            <Pickaxe className="w-4 h-4" /> Avg. Cost / Hectare
          </span>
          <span className="text-2xl font-bold text-slate-800 dark:text-white">
            ₹{financialData.avgCostPerHectare?.toLocaleString()}
          </span>
        </div>
        
        <div className="bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 p-4 rounded-xl flex flex-col gap-1 transition-colors">
          <span className="text-sm text-slate-500 dark:text-slate-400 flex items-center gap-1">
            <TrendingUp className="w-4 h-4" /> Expected Revenue
          </span>
          <span className="text-2xl font-bold text-slate-800 dark:text-white">
            ₹{financialData.expectedRevenue?.toLocaleString()}
          </span>
        </div>
      </div>
      
      <div className="mt-2 bg-slate-100 dark:bg-slate-900/50 border border-slate-300 dark:border-slate-700 p-4 rounded-xl flex justify-between items-center transition-colors">
        <span className="text-slate-700 dark:text-slate-300 font-medium">Estimated ROI</span>
        <span className={`text-3xl font-black ${roiColor}`}>
          {roiValue > 0 ? '+' : ''}{financialData.roi}
        </span>
      </div>
    </motion.div>
  );
};

export default Financials;
