import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

import { 
  Landmark, 
  ChevronDown, 
  ChevronUp, 
  ExternalLink, 
  BadgeIndianRupee, 
  Shield, 
  CreditCard, 
  Sprout, 
  Cpu, 
  Award, 
  Trees, 
  Banknote,
  CheckCircle2,
  Sparkles
} from 'lucide-react';

// Maps icon strings from the JSON to actual Lucide components
const iconMap = {
  'banknote': Banknote,
  'shield': Shield,
  'credit-card': CreditCard,
  'badge-indian-rupee': BadgeIndianRupee,
  'sprout': Sprout,
  'cpu': Cpu,
  'award': Award,
  'trees': Trees,
};

const SchemeCard = ({ scheme, index, isUniversal }) => {
  const [expanded, setExpanded] = useState(false);
  const IconComponent = iconMap[scheme.icon] || Landmark;
  

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06 }}
      className={`
        relative rounded-2xl border p-4 cursor-pointer transition-all duration-300
        ${isUniversal 
          ? 'bg-indigo-50/60 dark:bg-indigo-900/20 border-indigo-200/60 dark:border-indigo-500/20 hover:border-indigo-400/60 dark:hover:border-indigo-400/40' 
          : 'bg-amber-50/60 dark:bg-amber-900/20 border-amber-200/60 dark:border-amber-500/20 hover:border-amber-400/60 dark:hover:border-amber-400/40'
        }
        hover:shadow-lg hover:shadow-black/5 dark:hover:shadow-black/20
      `}
      onClick={() => setExpanded(!expanded)}
    >
      {/* Header Row */}
      <div className="flex items-start gap-3">
        <div className={`
          flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center
          ${isUniversal 
            ? 'bg-indigo-100 dark:bg-indigo-800/40 text-indigo-600 dark:text-indigo-300' 
            : 'bg-amber-100 dark:bg-amber-800/40 text-amber-600 dark:text-amber-300'
          }
        `}>
          <IconComponent className="w-5 h-5" />
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h4 className="font-semibold text-sm text-slate-800 dark:text-white leading-tight">
              {scheme.name}
            </h4>
            <span className={`
              text-[10px] font-bold uppercase px-2 py-0.5 rounded-full tracking-wider
              ${isUniversal 
                ? 'bg-indigo-200/80 text-indigo-700 dark:bg-indigo-700/50 dark:text-indigo-200' 
                : 'bg-amber-200/80 text-amber-700 dark:bg-amber-700/50 dark:text-amber-200'
              }
            `}>
              {scheme.benefitType}
            </span>
          </div>
          
          <div className="flex items-center gap-2 mt-1">
            <span className="text-base font-bold text-emerald-600 dark:text-emerald-400">
              {scheme.benefitAmount}
            </span>
          </div>
        </div>
        
        <button 
          className="flex-shrink-0 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
          aria-label={expanded ? "Collapse details" : "Expand details"}
        >
          {expanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
        </button>
      </div>

      {/* Expandable Details */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="mt-3 pt-3 border-t border-slate-200/50 dark:border-white/10 space-y-2">
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                {scheme.description}
              </p>
              
              <div className="flex items-start gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 mt-0.5 flex-shrink-0" />
                <span><strong className="text-slate-700 dark:text-slate-300">Eligibility:</strong> {scheme.eligibility || scheme.details || scheme.description}</span>
              </div>
              
              <a
                href={scheme.link}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className={`
                  inline-flex items-center gap-1.5 text-xs font-medium mt-1 transition-colors
                  ${isUniversal 
                    ? 'text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300' 
                    : 'text-amber-600 dark:text-amber-400 hover:text-amber-800 dark:hover:text-amber-300'
                  }
                `}
              >
                Apply on Official Portal <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

const GovernmentSchemes = ({ subsidyData }) => {
  
  const [showAll, setShowAll] = useState(false);

  if (!subsidyData) return null;

  const { universal = [], cropSpecific = [], totalSchemes, estimatedBenefitSummary, crop } = subsidyData;
  const allSchemes = [...cropSpecific, ...universal];
  const displayedSchemes = showAll ? allSchemes : allSchemes.slice(0, 3);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="glass-panel p-6 flex flex-col gap-4 w-full"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold flex items-center gap-2 text-amber-600 dark:text-amber-400">
          <Landmark className="w-6 h-6" />
          Government Schemes & Subsidies
        </h2>
        <div className="flex items-center gap-1.5">
          <Sparkles className="w-4 h-4 text-amber-500" />
          <span className="text-sm font-bold text-amber-600 dark:text-amber-400">
            {totalSchemes} Found
          </span>
        </div>
      </div>

      {/* Summary Banner */}
      <div className="bg-gradient-to-r from-amber-500/10 via-emerald-500/10 to-indigo-500/10 dark:from-amber-500/5 dark:via-emerald-500/5 dark:to-indigo-500/5 border border-amber-200/40 dark:border-amber-500/20 rounded-xl px-4 py-3">
        <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
          <span className="font-semibold text-amber-700 dark:text-amber-300">
            💰 {'For %crop% farmers:'.replace('%crop%', crop?.charAt(0).toUpperCase() + crop?.slice(1))}
          </span>{' '}
          {(estimatedBenefitSummary || '').replace(
            /(\d+) government schemes available/g, 
            (_, count) => `${count} $government schemes available`
          ).replace(
            'MSP price guarantee active',
            'MSP price guarantee active'
          )}
        </p>
      </div>

      {/* Crop-Specific Schemes Section */}
      {cropSpecific.length > 0 && (
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 mb-2 ml-1">
            🎯 Crop-Specific Schemes
          </h3>
          <div className="flex flex-col gap-2">
            {cropSpecific.map((scheme, idx) => (
              <SchemeCard 
                key={scheme.id} 
                scheme={scheme} 
                index={idx} 
                isUniversal={false} 
              />
            ))}
          </div>
        </div>
      )}

      {/* Universal Schemes Section */}
      <div>
        <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 mb-2 ml-1">
          🇮🇳 Universal Schemes (All Farmers)
        </h3>
        <div className="flex flex-col gap-2">
          {(showAll ? universal : universal.slice(0, cropSpecific.length > 0 ? 1 : 3)).map((scheme, idx) => (
            <SchemeCard 
              key={scheme.id} 
              scheme={scheme} 
              index={idx + cropSpecific.length} 
              isUniversal={true} 
            />
          ))}
        </div>
      </div>

      {/* Show More / Less Toggle */}
      {allSchemes.length > 3 && (
        <button
          onClick={() => setShowAll(!showAll)}
          className="self-center text-sm font-medium text-slate-500 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors flex items-center gap-1 mt-1"
        >
          {showAll ? (
            <>Show Less <ChevronUp className="w-4 h-4" /></>
          ) : (
            <>View All {totalSchemes} Schemes <ChevronDown className="w-4 h-4" /></>
          )}
        </button>
      )}
    </motion.div>
  );
};

export default GovernmentSchemes;
