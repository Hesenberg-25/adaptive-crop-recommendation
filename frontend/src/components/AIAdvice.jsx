import React from 'react';
import { Bot, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';

const AIAdvice = ({ adviceText }) => {
  if (!adviceText) {
    return null;
  }

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.2 }}
      className="glass-panel p-6 flex flex-col gap-4 w-full border-purple-500/30 relative overflow-hidden"
    >
      {/* Background decoration */}
      <div className="absolute -top-10 -right-10 w-32 h-32 bg-purple-500/10 rounded-full blur-2xl"></div>
      
      <h2 className="text-xl font-semibold mb-2 flex items-center gap-2 text-purple-600 dark:text-purple-400">
        <Bot className="w-6 h-6" />
        Gemini AI Agronomist
      </h2>
      
      <div className="bg-slate-50 dark:bg-white/5 border border-purple-200 dark:border-purple-500/20 p-5 rounded-xl shadow-inner relative transition-colors">
        <Sparkles className="absolute top-3 right-3 w-4 h-4 text-purple-500 dark:text-purple-400 opacity-50" />
        <p className="text-slate-700 dark:text-slate-200 leading-relaxed italic">
          "{adviceText}"
        </p>
      </div>
    </motion.div>
  );
};

export default AIAdvice;
