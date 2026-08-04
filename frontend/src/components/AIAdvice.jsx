import React from 'react';
import { Sparkles, Leaf } from 'lucide-react';
import { motion } from 'framer-motion';
import ReactMarkdown from 'react-markdown';

const AIAdvice = ({ adviceText }) => {
  if (!adviceText) {
    return null;
  }

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.2 }}
      className="bg-gradient-to-br from-[#1B3D1B] to-[#2F4B26] dark:from-[#0F1F0D] dark:to-[#223321] text-white p-6 flex flex-col gap-4 w-full border border-farm-border dark:border-farm-primary/50 rounded-3xl shadow-xl dark:shadow-[0_0_20px_rgba(111,166,87,0.15)] relative overflow-hidden transition-all"
    >
      {/* Background decoration */}
      <div className="absolute -top-10 -right-10 w-32 h-32 bg-farm-primary-light/30 rounded-full blur-2xl"></div>
      <div className="absolute -bottom-4 -right-4 text-farm-primary-light opacity-40 pointer-events-none">
        <Leaf className="w-32 h-32" />
      </div>
      
      <h2 className="text-xl font-semibold mb-2 flex items-center gap-2 text-farm-accent-gold dark:text-farm-text-heading relative z-10 transition-colors">
        <Sparkles className="w-6 h-6 text-farm-accent-gold" />
        AI Insight
      </h2>
      
      <div className="bg-white/10 backdrop-blur-md border border-white/20 p-5 rounded-xl shadow-inner relative transition-colors z-10">
        <div className="prose prose-invert max-w-none text-white/90 dark:text-farm-text-heading text-sm md:text-base leading-relaxed font-lora">
          <ReactMarkdown>{adviceText}</ReactMarkdown>
        </div>
      </div>
    </motion.div>
  );
};

export default AIAdvice;
