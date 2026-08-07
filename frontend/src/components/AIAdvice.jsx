import React from 'react';
import { Sparkles, Leaf } from 'lucide-react';
import { motion } from 'framer-motion';
import ReactMarkdown from 'react-markdown';

const AIAdvice = ({ adviceText }) => {
  if (!adviceText) return null;

  return (
    <div className="flex flex-col gap-4 w-full">
      {/* Header Card */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-3 p-4 bg-gradient-to-r from-emerald-600 to-teal-700 dark:from-[#0F2D1A] dark:to-[#1B3D2A] rounded-2xl border border-emerald-500/30 shadow-lg"
      >
        <motion.div
          animate={{ rotate: [0, 15, -15, 0] }}
          transition={{ duration: 4, repeat: Infinity, repeatDelay: 2 }}
          className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0"
        >
          <Sparkles className="w-6 h-6 text-white" />
        </motion.div>
        <div>
          <div className="text-white font-bold text-lg font-poppins">Expert AI Insights</div>
          <div className="text-emerald-200 text-xs">Powered by AI Agronomist Engine</div>
        </div>
        <motion.div
          className="ml-auto"
          animate={{ y: [0, -5, 0] }}
          transition={{ duration: 3, repeat: Infinity }}
        >
          <Leaf className="w-8 h-8 text-emerald-300/50" />
        </motion.div>
      </motion.div>

      {/* Main Content Card */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="glass-panel p-6 md:p-8 overflow-hidden"
      >
        <div className="prose prose-sm md:prose-base dark:prose-invert max-w-none text-slate-700 dark:text-slate-200 font-lora leading-relaxed 
                        marker:text-emerald-500 
                        prose-headings:text-farm-primary dark:prose-headings:text-emerald-400 prose-headings:font-poppins prose-headings:font-bold
                        prose-strong:text-slate-900 dark:prose-strong:text-white
                        prose-ul:list-disc prose-ol:list-decimal prose-li:my-1
                        prose-p:mb-4 last:prose-p:mb-0">
          <ReactMarkdown>{adviceText}</ReactMarkdown>
        </div>
      </motion.div>
    </div>
  );
};

export default AIAdvice;
