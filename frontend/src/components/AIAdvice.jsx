import React, { useState, useMemo } from 'react';
import { Sparkles, Wheat, Droplets, TrendingUp, Thermometer, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';


const TABS = [
  { id: 'crop', label: 'Crop Recommendations', icon: <Wheat className="w-4 h-4" />, emoji: '🌾', keywords: ['crop', 'rice', 'wheat', 'maize', 'millet', 'sorghum', 'recommend', 'suitable', 'sow', 'harvest', 'plant', 'grow', 'cultivat', 'npk', 'nitrogen', 'phosphorus', 'potassium', 'soil'] },
  { id: 'water', label: 'Water Strategy', icon: <Droplets className="w-4 h-4" />, emoji: '💧', keywords: ['water', 'irrigat', 'rain', 'moisture', 'drought', 'flood', 'drainage', 'humid', 'precipitation', 'monsoon'] },
  { id: 'market', label: 'Market Insights', icon: <TrendingUp className="w-4 h-4" />, emoji: '💰', keywords: ['market', 'price', 'cost', 'profit', 'roi', 'income', 'revenue', 'sell', 'mandi', 'demand', 'supply', '₹', 'rupee', 'economic'] },
  { id: 'climate', label: 'Climate Impact', icon: <Thermometer className="w-4 h-4" />, emoji: '🌡️', keywords: ['climate', 'temperature', 'weather', 'season', 'heat', 'cold', 'frost', 'warm', 'cool', 'wind', 'forecast', 'uv', 'sunlight'] },
];

/**
 * Splits the AI advice text into category buckets by scanning paragraphs
 * for keyword matches. Paragraphs that don't match any category go to 'crop' (the default).
 */
const categorizeAdvice = (text) => {
  if (!text) return {};

  // Split into paragraphs (double newline) or markdown sections (headings)
  const sections = text.split(/\n(?=#{1,3}\s)|(?:\n\s*\n)/).filter(s => s.trim());

  const buckets = { crop: [], water: [], market: [], climate: [] };

  for (const section of sections) {
    const lower = section.toLowerCase();
    let bestMatch = 'crop'; // default bucket
    let bestScore = 0;

    for (const tab of TABS) {
      const score = tab.keywords.reduce((acc, kw) => {
        const regex = new RegExp(kw, 'gi');
        const matches = lower.match(regex);
        return acc + (matches ? matches.length : 0);
      }, 0);

      if (score > bestScore) {
        bestScore = score;
        bestMatch = tab.id;
      }
    }

    buckets[bestMatch].push(section.trim());
  }

  return buckets;
};


const AIAdvice = ({ adviceText }) => {
  const [activeTab, setActiveTab] = useState('crop');
  const [expandedSections, setExpandedSections] = useState({});

  if (!adviceText) return null;

  const categorized = useMemo(() => categorizeAdvice(adviceText), [adviceText]);

  const toggleSection = (idx) => {
    setExpandedSections(prev => ({ ...prev, [idx]: !prev[idx] }));
  };

  // Get all non-empty tabs
  const availableTabs = TABS.filter(tab => categorized[tab.id] && categorized[tab.id].length > 0);
  const activeContent = categorized[activeTab] || [];

  return (
    <div className="flex flex-col gap-4 w-full">
      {/* Header Card with Shimmer */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-3 p-4 bg-gradient-to-r from-emerald-600 to-teal-700 dark:from-[#0F2D1A] dark:to-[#1B3D2A] rounded-2xl border border-emerald-500/30 shadow-lg relative overflow-hidden"
      >
        {/* Shimmer Effect */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="shimmer-bar" />
        </div>

        {/* Live Indicator */}
        <div className="absolute top-3 right-4 flex items-center gap-1.5 z-10">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="text-[9px] font-black text-emerald-300 uppercase tracking-widest">Live AI</span>
        </div>

        <motion.div
          animate={{ rotate: [0, 15, -15, 0] }}
          transition={{ duration: 4, repeat: Infinity, repeatDelay: 2 }}
          className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0 relative z-10"
        >
          <Sparkles className="w-6 h-6 text-white" />
        </motion.div>
        <div className="relative z-10">
          <div className="text-white font-bold text-lg font-poppins">Expert AI Insights</div>
          <div className="text-emerald-200 text-xs">Powered by AI Agronomist Engine</div>
        </div>
      </motion.div>

      {/* Tab Navigation */}
      <div className="flex gap-2 overflow-x-auto pb-1 snap-x">
        {availableTabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold whitespace-nowrap snap-start transition-all duration-200 ${
              activeTab === tab.id
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/30 scale-[1.02]'
                : 'bg-white/60 dark:bg-white/5 text-slate-600 dark:text-slate-400 border border-white/30 dark:border-white/10 hover:bg-white/80 dark:hover:bg-white/10 hover:scale-[1.01]'
            }`}
          >
            <span className="text-base">{tab.emoji}</span>
            <span>{tab.label}</span>
            {categorized[tab.id]?.length > 0 && (
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-black ${
                activeTab === tab.id
                  ? 'bg-white/20 text-white'
                  : 'bg-slate-200 dark:bg-white/10 text-slate-500 dark:text-slate-400'
              }`}>
                {categorized[tab.id].length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Main Content Card — Animated Tab Panels */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
          className="glass-panel-refined p-5 md:p-7 overflow-hidden bg-white/90 dark:bg-[#0F2D1A]/95"
        >
          {activeContent.length === 0 ? (
            <div className="text-center py-12 text-slate-400 dark:text-slate-500 italic font-lora">
              No insights available for this category with the current prediction.
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {activeContent.map((section, idx) => {
                // Check if it starts with a heading
                const headingMatch = section.match(/^(#{1,3})\s+(.*)/);
                const isLong = section.length > 200;
                const isExpanded = expandedSections[idx] !== false; // default expanded

                if (headingMatch && isLong) {
                  // Accordion for long sections
                  return (
                    <div key={idx} className="bg-white/50 dark:bg-black/20 rounded-2xl border border-white/20 dark:border-white/5 overflow-hidden">
                      <button
                        onClick={() => toggleSection(idx)}
                        className="w-full flex items-center justify-between p-4 text-left hover:bg-white/30 dark:hover:bg-white/5 transition-colors"
                      >
                        <span className="font-bold text-base text-slate-800 dark:text-white font-poppins flex items-center gap-2">
                          {headingMatch[2]}
                        </span>
                        <ChevronDown className={`w-5 h-5 text-slate-400 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} />
                      </button>
                      <AnimatePresence initial={false}>
                        {isExpanded && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="overflow-hidden"
                          >
                            <div className="px-4 pb-4 prose prose-sm dark:prose-invert max-w-none text-slate-700 dark:text-slate-200 font-lora leading-[1.7]
                                            prose-headings:hidden
                                            prose-strong:text-slate-900 dark:prose-strong:text-white
                                            prose-p:mb-3 last:prose-p:mb-0">
                              <ReactMarkdown>{section}</ReactMarkdown>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                }

                // Regular card for shorter sections
                return (
                  <div key={idx} className="bg-white/50 dark:bg-black/20 p-4 rounded-2xl border border-white/20 dark:border-white/5">
                    <div className="prose prose-sm dark:prose-invert max-w-none text-slate-700 dark:text-slate-200 font-lora leading-[1.7]
                                    marker:text-emerald-500
                                    prose-headings:text-farm-primary dark:prose-headings:text-emerald-400 prose-headings:font-poppins prose-headings:font-bold prose-headings:text-base prose-headings:mb-2
                                    prose-strong:text-slate-900 dark:prose-strong:text-white
                                    prose-p:mb-3 last:prose-p:mb-0">
                      <ReactMarkdown>{section}</ReactMarkdown>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default AIAdvice;
