import React from 'react';
import { CloudRain, Zap } from 'lucide-react';

const Simulator = ({ baseRainfall, reductionPercent, onReductionChange }) => {
  const simulatedRainfall = baseRainfall * (1 - reductionPercent / 100);

  return (
    <div className="glass-panel p-6 flex flex-col gap-4 w-full border-red-500/30">
      <h2 className="text-xl font-semibold mb-2 flex items-center gap-2 text-red-400">
        <Zap className="w-6 h-6" />
        "What-If?" Drought Simulator
      </h2>
      <p className="text-sm text-slate-300">
        Dynamically reduce rainfall to see how the model adapts to drought conditions in real-time.
      </p>
      
      <div className="flex flex-col gap-2 mt-4">
        <div className="flex justify-between items-center text-sm">
          <label className="flex items-center gap-2 text-slate-300">
            <CloudRain className="w-5 h-5 text-blue-400" /> Rainfall Reduction
          </label>
          <span className="font-mono text-red-300 bg-red-900/30 px-2 py-1 rounded-md">
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
          className="w-full accent-red-500 h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer"
        />
        
        <div className="mt-4 flex justify-between items-center bg-black/20 p-3 rounded-lg border border-white/5">
          <span className="text-slate-400 text-sm">Effective Rainfall:</span>
          <span className="text-xl font-bold text-blue-300">{simulatedRainfall.toFixed(1)} mm</span>
        </div>
      </div>
    </div>
  );
};

export default Simulator;
