import React from 'react';
import { Sprout, TrendingUp, AlertCircle } from 'lucide-react';
import clsx from 'clsx';

const ResultsCards = ({ predictions }) => {
  if (!predictions || predictions.length === 0) {
    return null;
  }

  return (
    <div className="glass-panel p-6 flex flex-col gap-4 w-full border-emerald-500/30">
      <h2 className="text-xl font-semibold mb-2 flex items-center gap-2 text-emerald-400">
        <Sprout className="w-6 h-6" />
        Top 3 Crop Recommendations
      </h2>
      
      <div className="flex flex-col gap-4 mt-2">
        {predictions.map((pred, idx) => (
          <div key={idx} className={clsx(
            "p-4 rounded-xl border relative overflow-hidden transition-all",
            idx === 0 ? "bg-emerald-900/40 border-emerald-500/50" : "bg-white/5 border-white/10"
          )}>
            {idx === 0 && (
              <div className="absolute top-0 right-0 bg-emerald-500 text-white text-xs font-bold px-3 py-1 rounded-bl-lg">
                #1 Match
              </div>
            )}
            
            <div className="flex justify-between items-end mb-2">
              <h3 className="text-2xl font-bold capitalize text-white">{pred.crop}</h3>
              <span className="text-lg font-mono text-emerald-300">{pred.confidence}% Match</span>
            </div>
            
            {/* Progress Bar */}
            <div className="w-full bg-slate-800 rounded-full h-2 mb-4">
              <div 
                className="bg-gradient-to-r from-emerald-500 to-teal-400 h-2 rounded-full transition-all duration-1000"
                style={{ width: `${pred.confidence}%` }}
              ></div>
            </div>
            
            {/* SHAP Tags */}
            <div className="flex flex-wrap gap-2">
              {pred.shap.map((tag, tIdx) => (
                <span 
                  key={tIdx} 
                  className={clsx(
                    "text-xs px-2 py-1 rounded-md flex items-center gap-1",
                    tag.value > 0 ? "bg-emerald-500/20 text-emerald-200" : "bg-red-500/20 text-red-200"
                  )}
                >
                  {tag.value > 0 ? <TrendingUp className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
                  {tag.value > 0 ? '+' : ''}{tag.value}% {tag.feature} Impact
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ResultsCards;
