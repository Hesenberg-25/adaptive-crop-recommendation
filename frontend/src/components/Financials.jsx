import React from 'react';
import { IndianRupee, TrendingUp, Pickaxe } from 'lucide-react';

const Financials = ({ financialData }) => {
  if (!financialData) {
    return null;
  }

  const roiColor = financialData.roi > 50 ? 'text-emerald-400' : financialData.roi > 0 ? 'text-amber-400' : 'text-red-400';

  return (
    <div className="glass-panel p-6 flex flex-col gap-4 w-full border-blue-500/30">
      <h2 className="text-xl font-semibold mb-2 flex items-center gap-2 text-blue-400">
        <IndianRupee className="w-6 h-6" />
        Financial Feasibility & ROI
      </h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
        <div className="bg-white/5 border border-white/10 p-4 rounded-xl flex flex-col gap-1">
          <span className="text-sm text-slate-400 flex items-center gap-1">
            <Pickaxe className="w-4 h-4" /> Avg. Cost / Hectare
          </span>
          <span className="text-2xl font-bold text-white">
            ₹{financialData.avgCostPerHectare.toLocaleString()}
          </span>
        </div>
        
        <div className="bg-white/5 border border-white/10 p-4 rounded-xl flex flex-col gap-1">
          <span className="text-sm text-slate-400 flex items-center gap-1">
            <TrendingUp className="w-4 h-4" /> Expected Revenue
          </span>
          <span className="text-2xl font-bold text-white">
            ₹{financialData.expectedRevenue.toLocaleString()}
          </span>
        </div>
      </div>
      
      <div className="mt-2 bg-slate-900/50 border border-slate-700 p-4 rounded-xl flex justify-between items-center">
        <span className="text-slate-300">Estimated ROI</span>
        <span className={`text-3xl font-black ${roiColor}`}>
          {financialData.roi > 0 ? '+' : ''}{financialData.roi.toFixed(1)}%
        </span>
      </div>
    </div>
  );
};

export default Financials;
