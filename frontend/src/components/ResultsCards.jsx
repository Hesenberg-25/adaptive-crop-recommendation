import React from 'react';
import { Sprout, TrendingUp, AlertCircle, Ban, IndianRupee, Droplets } from 'lucide-react';
import clsx from 'clsx';
import { motion } from 'framer-motion';

const ResultsCards = ({ recommendedCrops, avoidCrops }) => {
  if ((!recommendedCrops || recommendedCrops.length === 0) && (!avoidCrops || avoidCrops.length === 0)) {
    return null;
  }

  const renderCropCard = (pred, idx, isRecommended) => {
    const isTop = isRecommended && idx === 0;
    
    return (
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: idx * 0.1 }}
        key={idx} 
        className={clsx(
          "p-4 rounded-xl border relative overflow-hidden transition-all",
          isRecommended
            ? isTop
              ? "bg-emerald-50 dark:bg-emerald-900/40 border-emerald-500/50" 
              : "bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10"
            : "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800"
        )}
      >
        {isTop && (
          <div className="absolute top-0 right-0 bg-emerald-500 text-white text-xs font-bold px-3 py-1 rounded-bl-lg shadow-sm">
            #1 Match
          </div>
        )}
        
        <div className="flex justify-between items-end mb-2">
          <h3 className={clsx("text-2xl font-bold capitalize", isRecommended ? "text-slate-800 dark:text-white" : "text-red-900 dark:text-red-100")}>
            {pred.crop || pred.name}
          </h3>
          <span className={clsx("text-lg font-mono", isRecommended ? "text-emerald-600 dark:text-emerald-300" : "text-red-600 dark:text-red-400")}>
            {pred.confidence}% Match
          </span>
        </div>
        
        {/* Progress Bar */}
        <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-2 mb-4">
          <div 
            className={clsx("h-2 rounded-full transition-all duration-1000", isRecommended ? "bg-gradient-to-r from-emerald-400 to-teal-500" : "bg-gradient-to-r from-red-400 to-rose-500")}
            style={{ width: `${pred.confidence}%` }}
          ></div>
        </div>

        {/* Financial & Feasibility Data */}
        {pred.roi && (
          <div className="flex flex-wrap gap-3 mb-4 mt-2 p-3 bg-white/50 dark:bg-black/20 rounded-lg border border-slate-200/50 dark:border-white/5">
            <div className="flex items-center gap-1.5 text-sm">
              <IndianRupee className="w-4 h-4 text-slate-500" />
              <span className="font-semibold text-slate-700 dark:text-slate-300">ROI:</span>
              <span className={clsx("font-bold", parseFloat(pred.roi) > 50 ? "text-emerald-600 dark:text-emerald-400" : parseFloat(pred.roi) > 0 ? "text-amber-600 dark:text-amber-400" : "text-red-600 dark:text-red-400")}>
                {parseFloat(pred.roi) > 0 ? '+' : ''}{pred.roi}%
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-sm border-l border-slate-300 dark:border-slate-700 pl-3">
              <Droplets className="w-4 h-4 text-blue-500" />
              <span className="font-semibold text-slate-700 dark:text-slate-300">Feasibility:</span>
              <span className={clsx("font-bold", pred.feasibility === 'High' ? "text-emerald-600 dark:text-emerald-400" : pred.feasibility === 'Medium' ? "text-amber-600 dark:text-amber-400" : "text-red-600 dark:text-red-400")}>
                {pred.feasibility}
              </span>
            </div>
          </div>
        )}
        
        {/* SHAP Tags (if available) */}
        {pred.shap && Array.isArray(pred.shap) && (
          <div className="flex flex-wrap gap-2">
            {pred.shap.map((tag, tIdx) => (
              <span 
                key={tIdx} 
                className={clsx(
                  "text-xs px-2 py-1 rounded-md flex items-center gap-1",
                  tag.value > 0 
                    ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-200" 
                    : "bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-200"
                )}
              >
                {tag.value > 0 ? <TrendingUp className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
                {tag.value > 0 ? '+' : ''}{tag.value}% {tag.feature} Impact
              </span>
            ))}
          </div>
        )}
      </motion.div>
    );
  };

  return (
    <div className="flex flex-col gap-6 w-full">
      {/* Recommended Section */}
      {recommendedCrops && recommendedCrops.length > 0 && (
        <div className="glass-panel p-6 flex flex-col gap-4 w-full">
          <h2 className="text-xl font-semibold mb-2 flex items-center gap-2 text-emerald-500 dark:text-emerald-400">
            <Sprout className="w-6 h-6" />
            Top AI Crop Recommendations
          </h2>
          <div className="flex flex-col gap-4 mt-2">
            {recommendedCrops.map((pred, idx) => renderCropCard(pred, idx, true))}
          </div>
        </div>
      )}

      {/* Avoid Section */}
      {avoidCrops && avoidCrops.length > 0 && (
        <div className="glass-panel border-red-500/30 p-6 flex flex-col gap-4 w-full bg-red-50/30 dark:bg-red-900/10">
          <h2 className="text-xl font-semibold mb-2 flex items-center gap-2 text-red-600 dark:text-red-400">
            <Ban className="w-6 h-6" />
            Crops to Avoid
          </h2>
          <p className="text-sm text-red-800/80 dark:text-red-200/80 mb-2">
            These crops have a low probability of success based on your current soil and climate profile.
          </p>
          <div className="flex flex-col gap-4 mt-2">
            {avoidCrops.map((pred, idx) => renderCropCard(pred, idx, false))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ResultsCards;
