import React from 'react';
import { Bot, Sparkles } from 'lucide-react';

const AIAdvice = ({ adviceText }) => {
  if (!adviceText) {
    return null;
  }

  return (
    <div className="glass-panel p-6 flex flex-col gap-4 w-full border-purple-500/30 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute -top-10 -right-10 w-32 h-32 bg-purple-500/10 rounded-full blur-2xl"></div>
      
      <h2 className="text-xl font-semibold mb-2 flex items-center gap-2 text-purple-400">
        <Bot className="w-6 h-6" />
        Gemini AI Agronomist
      </h2>
      
      <div className="bg-white/5 border border-purple-500/20 p-5 rounded-xl shadow-inner relative">
        <Sparkles className="absolute top-3 right-3 w-4 h-4 text-purple-400 opacity-50" />
        <p className="text-slate-200 leading-relaxed italic">
          "{adviceText}"
        </p>
      </div>
    </div>
  );
};

export default AIAdvice;
