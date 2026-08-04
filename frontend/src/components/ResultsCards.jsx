import React from 'react';
import { Sprout, TrendingUp, AlertCircle, IndianRupee, Droplets, Ban } from 'lucide-react';
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
          "p-4 rounded-xl border relative overflow-hidden transition-all shadow-[0_4px_14px_rgba(139,105,20,0.08)] dark:shadow-none",
          pred.isMarginal ? "opacity-80 grayscale-[20%]" : "",
          isRecommended
            ? isTop
              ? "bg-[#FDF2D9]/90 dark:bg-[#1B2A17]/80 backdrop-blur-md border-l-4 border-l-farm-primary border-t border-r border-b border-farm-primary-light/50 dark:border-white/5 dark:border-t-white/10" 
              : "bg-[#FDF8ED]/90 dark:bg-[#1B2A17]/80 backdrop-blur-md border-l-4 border-l-farm-primary border-t border-r border-b border-farm-border dark:border-white/5 dark:border-t-white/10"
            : "bg-[#FFF4F0]/90 dark:bg-gradient-to-br dark:from-[#1F0F0F]/90 dark:to-[#2A1414]/90 backdrop-blur-md border-l-4 border-l-[#C0392B] border-t border-r border-b border-[#F0C4C4] dark:border-[#4A2020] dark:shadow-[0_0_12px_rgba(220,60,60,0.15)]"
        )}
      >
        {(isTop || (isRecommended && pred.isMarginal)) && (
          <div className={clsx(
            "absolute top-0 right-0 text-xs font-bold px-3 py-1 rounded-bl-lg shadow-sm z-10",
            pred.isMarginal ? "bg-farm-accent-gold text-[#2B1B12]" : "bg-farm-primary text-white"
          )}>
            {isTop ? (pred.isMarginal ? "#1 Match (Marginal)" : "#1 Match") : "Marginal fit"}
          </div>
        )}
        
        <div className="flex justify-between items-end mb-2">
          <h3 className={clsx("text-2xl font-bold capitalize", isRecommended ? "text-slate-800 dark:text-white" : "text-[#6B1D1D] dark:text-[#F0DCDC]")}>
            {pred.crop || pred.name}
          </h3>
          <span className={clsx("text-lg font-mono", isRecommended ? "text-emerald-600 dark:text-emerald-300" : "text-[#C0392B] dark:text-[#FF6B6B]")}>
            {pred.confidence}% Match
          </span>
        </div>
        
        {/* Progress Bar */}
        <div className={clsx("w-full rounded-full h-2 mb-4", isRecommended ? "bg-farm-border dark:bg-white/10" : "bg-[#F0DCDC] dark:bg-[#2A1414]")}>
          <div 
            className={clsx("h-2 rounded-full transition-all duration-1000", isRecommended ? "bg-gradient-to-r from-farm-primary-light to-farm-primary" : "bg-gradient-to-r from-[#E74C3C] to-[#C0392B] dark:from-[#B23A3A] dark:to-[#FF6B6B]")}
            style={{ width: `${pred.confidence}%` }}
          ></div>
        </div>

        {/* Financial Data (ROI & Investment) */}
        {pred.roi && (
          <div className="flex flex-col gap-2 mb-4 mt-2">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              <div className="flex flex-col items-center p-2.5 bg-white/60 dark:bg-black/20 rounded-lg border border-slate-200/60 dark:border-white/10">
                <span className="text-xs text-slate-500 dark:text-slate-400 mb-1 flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" /> ROI
                </span>
                <span className={clsx("text-base font-bold", parseFloat(pred.roi) > 50 ? "text-emerald-600 dark:text-emerald-400" : parseFloat(pred.roi) > 0 ? "text-amber-600 dark:text-amber-400" : "text-red-600 dark:text-red-400")}>
                  {parseFloat(pred.roi) > 0 ? '+' : ''}{pred.roi}%
                </span>
              </div>
              <div className="flex flex-col items-center p-2.5 bg-white/60 dark:bg-black/20 rounded-lg border border-slate-200/60 dark:border-white/10">
                <span className="text-xs text-slate-500 dark:text-slate-400 mb-1 flex items-center gap-1">
                  <IndianRupee className="w-3 h-3" /> Net Return/ha
                </span>
                <span className={clsx("text-base font-bold", pred.netReturnPerHectare > 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400")}>
                  {pred.netReturnPerHectare > 0 ? '+' : ''}₹{Number(pred.netReturnPerHectare || pred.investment || 0).toLocaleString('en-IN')}
                </span>
              </div>
              <div className="flex flex-col items-center p-2.5 bg-white/60 dark:bg-black/20 rounded-lg border border-slate-200/60 dark:border-white/10">
                <span className="text-xs text-slate-500 dark:text-slate-400 mb-1 flex items-center gap-1">
                  <Droplets className="w-3 h-3" /> Rainfall Fit
                </span>
                <span className={clsx("text-base font-bold", pred.rainfallFit === 'High' ? "text-emerald-600 dark:text-emerald-400" : pred.rainfallFit === 'Medium' ? "text-amber-600 dark:text-amber-400" : "text-red-600 dark:text-red-400")}>
                  {pred.rainfallFit || 'Unknown'}
                </span>
              </div>
            </div>
            {!isRecommended && pred.avoidReason && (
              <div className="flex flex-col gap-1 text-sm border-l-2 border-[#F0C4C4] dark:border-[#4A2020] pl-3 w-full p-2 bg-red-50/50 dark:bg-red-900/10 rounded-r-lg">
                <div className="flex items-start gap-1.5">
                  <span className="font-semibold text-[#C0392B] dark:text-[#FF6B6B] whitespace-nowrap">⚠️ Risk-Adjusted Outlook:</span>
                  <span className="font-medium text-[#8A6060] dark:text-[#F0DCDC]">{pred.avoidReason}</span>
                </div>
              </div>
            )}
          </div>


        
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
        <div className="glass-panel p-6 flex flex-col gap-4 w-full relative">
          <h2 className="text-xl font-semibold mb-2 flex items-center gap-2 text-farm-primary border-b-2 border-transparent relative after:absolute after:bottom-[-4px] after:left-0 after:w-16 after:h-[2px] after:bg-gradient-to-r after:from-farm-accent-gold after:to-farm-primary">
            <Sprout className="w-6 h-6 text-farm-primary" />
            Top AI Crop Recommendations
          </h2>
          <div className="flex flex-col gap-4 mt-2">
            {recommendedCrops.map((pred, idx) => renderCropCard(pred, idx, true))}
          </div>
        </div>
      )}

      {/* Avoid Section */}
      {avoidCrops && avoidCrops.length > 0 && (
        <div className="glass-panel !bg-[#FFF4F0]/90 dark:!bg-gradient-to-br dark:!from-[#1F0F0F]/80 dark:!to-[#2A1414]/80 !border-[#F0C4C4] dark:!border-[#4A2020] p-6 flex flex-col gap-4 w-full relative">
          <h2 className="text-xl font-semibold mb-2 flex items-center gap-2 text-[#C0392B] dark:text-[#FF6B6B] border-b-2 border-transparent relative after:absolute after:bottom-[-4px] after:left-0 after:w-16 after:h-[2px] after:bg-gradient-to-r after:from-[#C0392B] after:to-transparent">
            <Ban className="w-6 h-6 text-[#C0392B] dark:text-[#FF6B6B]" />
            Crops to Avoid
          </h2>
          <p className="text-sm text-[#8A6060] dark:text-[#B89494] mb-2">
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
