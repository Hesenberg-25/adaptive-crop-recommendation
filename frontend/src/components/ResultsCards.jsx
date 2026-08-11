import React, { useState, useEffect } from 'react';
import { Sprout, TrendingUp, AlertCircle, IndianRupee, Droplets, Ban } from 'lucide-react';
import clsx from 'clsx';
import { motion } from 'framer-motion';

// In-memory cache so we don't re-fetch on every render
const imageCache = {};

const useCropImage = (cropName) => {
  const [imgUrl, setImgUrl] = useState(null);

  useEffect(() => {
    if (!cropName) return;
    const key = cropName.toLowerCase();

    if (imageCache[key]) {
      setImgUrl(imageCache[key]);
      return;
    }

    const accessKey = import.meta.env.VITE_UNSPLASH_ACCESS_KEY;
    if (!accessKey) return;

    fetch(
      `https://api.unsplash.com/search/photos?query=${encodeURIComponent(key + ' crop farm')}&per_page=1&orientation=squarish&client_id=${accessKey}`
    )
      .then((r) => r.json())
      .then((data) => {
        const url = data?.results?.[0]?.urls?.small;
        if (url) {
          imageCache[key] = url;
          setImgUrl(url);
        } else {
          fetch(
            `https://api.unsplash.com/search/photos?query=farming+field&per_page=1&orientation=squarish&client_id=${accessKey}`
          )
            .then((r) => r.json())
            .then((fd) => {
              const fb = fd?.results?.[0]?.urls?.small || '';
              imageCache[key] = fb;
              setImgUrl(fb);
            });
        }
      })
      .catch(() => setImgUrl(''));
  }, [cropName]);

  return imgUrl;
};

// Individual crop card
export const CropCard = ({ pred, isRecommended, idx }) => {
  const isTop = isRecommended && idx === 0;
  const cropImg = useCropImage(pred.crop || pred.name);

  let translatedAvoidReason = pred.avoidReason;
  if (translatedAvoidReason) {
    if (translatedAvoidReason === "Overall climate mismatch.") {
      // No translation needed for overall mismatch
    } else if (translatedAvoidReason.startsWith("Requires ")) {
      const match = translatedAvoidReason.match(/Requires (.*) soil, but (.*) soil was provided\./);
      if (match) {
        translatedAvoidReason = 'Requires %preferred% soil, but %provided% soil was provided.'
          .replace('%preferred%', match[1])
          .replace('%provided%', match[2]);
      }
    } else {
      const match = translatedAvoidReason.match(/(.*) \((.*)\) is too (high|low) for (.*) \(ideal (.*)\)\./);
      if (match) {
        translatedAvoidReason = '%feature% (%input%) is too %direction% for %crop% (ideal %ideal%).'
          .replace('%feature%', match[1])
          .replace('%input%', match[2])
          .replace('%direction%', match[3])
          .replace('%crop%', match[4])
          .replace('%ideal%', match[5]);
      }
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: idx * 0.1, type: 'spring', stiffness: 50 }}
      style={{ viewTransitionName: `crop-card-${(pred.crop || pred.name).replace(/\s+/g, '-')}` }}
      className={clsx(
        'group relative overflow-hidden flex flex-col rounded-3xl transition-all duration-300 @container/card shadow-lg hover:shadow-xl hover:-translate-y-1 h-full',
        isRecommended 
          ? 'bg-gradient-to-br from-white to-slate-50 dark:from-[#1B2A17] dark:to-[#10190F] border border-emerald-100 dark:border-emerald-900/30' 
          : 'bg-gradient-to-br from-white to-red-50/30 dark:from-red-950/20 dark:to-black/20 border border-red-100 dark:border-red-900/30'
      )}
    >
      {isTop && (
        <div className="absolute top-0 right-0 text-xs font-bold px-4 py-1.5 rounded-bl-xl z-10 bg-farm-primary text-white">
          ★ Top Recommendation
        </div>
      )}
      {!isTop && isRecommended && pred.isMarginal && (
        <div className="absolute top-0 right-0 text-xs font-bold px-4 py-1.5 rounded-bl-xl z-10 bg-farm-accent-gold text-[#2B1B12]">
          Marginal fit
        </div>
      )}

      {/* Top Header - Uses container queries to switch layout */}
      <div className="p-5 flex gap-4 items-center z-10 flex-row">
        <motion.div
          whileHover={{ scale: 1.05, rotate: -5 }}
          className={clsx(
            'rounded-full overflow-hidden border-4 shadow-md flex-shrink-0 bg-slate-100 dark:bg-slate-800 flex items-center justify-center border-glow w-20 h-20',
            isRecommended
              ? 'border-emerald-400 dark:border-farm-primary'
              : 'border-red-400 dark:border-red-800'
          )}
        >
          {cropImg ? (
            <img src={cropImg} alt={pred.crop || pred.name} className="w-full h-full object-cover" />
          ) : (
            <span className="text-3xl icon-pulse select-none">🌾</span>
          )}
        </motion.div>

        <div className="flex-grow w-full flex justify-between items-center">
          <div>
            <h3 className="font-extrabold capitalize font-poppins text-xl text-slate-800 dark:text-white">
              {pred.crop || pred.name}
            </h3>
            {isRecommended && (
              <div className="flex gap-2 mt-2">
                 <div className="bg-slate-100 dark:bg-white/10 px-2 py-1 rounded text-[10px] font-bold text-slate-600 dark:text-slate-300 flex items-center gap-1">🌱 Sow: {pred.sowMonth || '—'}</div>
                 <div className="bg-slate-100 dark:bg-white/10 px-2 py-1 rounded text-[10px] font-bold text-slate-600 dark:text-slate-300 flex items-center gap-1">🌾 Reap: {pred.harvestMonth || '—'}</div>
              </div>
            )}
          </div>
          <div className="text-right">
            <div className={clsx('font-bold font-mono text-xl', isRecommended ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400')}>
              {pred.confidence}%
            </div>
            <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">MATCH</div>
          </div>
        </div>
      </div>

      {/* Financial Data */}
      {pred.roi && (
        <div className="px-5 pb-5">
          {pred.isRealTimePrice && (
            <div className="flex items-center gap-1.5 mb-2 px-1">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                Live Mandi Price {pred.mandiNames && pred.mandiNames.length > 0 ? `(${pred.mandiNames.slice(0, 2).join(', ')}${pred.mandiNames.length > 2 ? ' etc' : ''})` : ''}
              </span>
            </div>
          )}
          <div className="grid grid-cols-3 gap-2 mb-3">
          {[
            { icon: <TrendingUp className="w-3.5 h-3.5 text-blue-500 icon-pulse" />, label: 'ROI', value: `${parseFloat(pred.roi) > 0 ? '+' : ''}${pred.roi}%`, positive: parseFloat(pred.roi) > 0 },
            { icon: <IndianRupee className="w-3.5 h-3.5 text-emerald-500 icon-pulse" />, label: 'Net/ha', value: `${pred.netReturnPerHectare > 0 ? '+' : ''}₹${Number(pred.netReturnPerHectare || 0).toLocaleString('en-IN')}`, positive: pred.netReturnPerHectare > 0 },
            { icon: <Droplets className="w-3.5 h-3.5 text-cyan-500 icon-pulse" />, label: 'Rain Fit', value: pred.rainfallFit ? pred.rainfallFit : 'N/A', positive: pred.rainfallFit === 'High' },
          ].map((stat, i) => (
            <div key={i} className="flex flex-col items-center p-2.5 bg-white/70 dark:bg-black/20 rounded-xl border border-slate-100 dark:border-white/5">
              <span className="text-[10px] text-slate-500 mb-1 flex items-center gap-1 font-bold uppercase tracking-wide">
                {stat.icon} {stat.label}
              </span>
              <span className={clsx('text-sm font-bold', stat.positive ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500 dark:text-red-400')}>
                {stat.value}
              </span>
            </div>
          ))}
        </div>
        </div>
      )}

      {!isRecommended && translatedAvoidReason && (
        <div className="flex items-start gap-2 text-sm border-l-4 border-red-500 pl-3 p-3 bg-red-50 dark:bg-red-900/20 rounded-r-xl mb-3">
          <Ban className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
          <span className="text-red-800 dark:text-red-200 font-medium">{translatedAvoidReason}</span>
        </div>
      )}

      {/* SHAP Tags */}
      {pred.shap && Array.isArray(pred.shap) && pred.shap.length > 0 && (
        <div className="flex flex-wrap gap-1.5 pt-2 border-t border-slate-100 dark:border-white/5">
          <span className="text-[10px] font-bold text-slate-400 flex items-center mr-1">AI Drivers:</span>
          {pred.shap.map((tag, tIdx) => (
            <span key={tIdx} className={clsx('text-[10px] font-semibold px-2 py-0.5 rounded-full flex items-center gap-1',
              tag.value > 0
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300'
                : 'bg-red-50 text-red-700 border border-red-200 dark:bg-red-500/10 dark:text-red-300'
            )}>
              {tag.value > 0 ? <TrendingUp className="w-2.5 h-2.5" /> : <AlertCircle className="w-2.5 h-2.5" />}
              {tag.value > 0 ? '+' : ''}{tag.value}% {tag.feature}
            </span>
          ))}
        </div>
      )}

      {/* NPK Color-Coded Pills */}
      {isRecommended && pred.roi && (
        <div className="flex flex-wrap gap-2 px-5 pb-5 pt-2">
          {[
            { label: 'N', key: 'N', color: 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800' },
            { label: 'P', key: 'P', color: 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800' },
            { label: 'K', key: 'K', color: 'bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-800' },
          ].map((pill) => {
            const status = pred.npkStatus ? pred.npkStatus[pill.key] : 'Optimal';
            return (
              <div key={pill.label} className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold border ${pill.color}`}>
                <span className="font-black">{pill.label}</span>
                <span className="opacity-70">{status}</span>
              </div>
            );
          })}
        </div>
      )}

    </motion.div>
  );
};

const ResultsCards = ({ recommendedCrops, avoidCrops, targetCropResult }) => {
    if ((!recommendedCrops || recommendedCrops.length === 0) && (!avoidCrops || avoidCrops.length === 0)) {
    return null;
  }

  return (
    <div className="flex flex-col gap-8 w-full">

      {/* ── Outer Target Crop Section Card ── */}
      {targetCropResult && (
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 80 }}
          className="glass-panel p-6 border-l-4 border-blue-500 dark:border-blue-600 bg-blue-50/50 dark:bg-blue-900/10"
        >
          <div className="flex items-center gap-3 mb-5">
            <motion.div
              className="w-11 h-11 rounded-full bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center"
            >
              <span className="text-xl">🎯</span>
            </motion.div>
            <div>
              <h2 className="text-xl font-bold font-poppins text-slate-800 dark:text-white">Your Selected Target Crop</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">Viability analysis for your specifically requested crop</p>
            </div>
          </div>
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-5 @container/results">
            <CropCard pred={targetCropResult} idx={0} isRecommended={targetCropResult.confidence >= 40} />
          </div>
        </motion.div>
      )}

      {/* ── Outer Recommended Section Card ── */}
      {recommendedCrops && recommendedCrops.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 80 }}
          className="glass-panel p-6 border-l-4 border-emerald-500 dark:border-emerald-600"
        >
          <div className="flex items-center gap-3 mb-5">
            <motion.div
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 3, repeat: Infinity, repeatDelay: 2 }}
              className="w-11 h-11 rounded-full bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center"
            >
              <Sprout className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
            </motion.div>
            <div>
              <h2 className="text-xl font-bold font-poppins text-slate-800 dark:text-white">Highly Recommended Crops</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">Based on your soil chemistry, climate, and market data</p>
            </div>
          </div>
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-5 @container/results">
            {recommendedCrops.map((pred, idx) => (
              <CropCard key={idx} pred={pred} idx={idx} isRecommended={true} />
            ))}
          </div>
        </motion.div>
      )}

      {/* ── Outer Avoid Section Card ── */}
      {avoidCrops && avoidCrops.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 80, delay: 0.1 }}
          className="glass-panel p-6 border-l-4 border-red-500 dark:border-red-700 !bg-[#FFF4F0]/90 dark:!bg-[#1F0F0F]/80"
        >
          <div className="flex items-center gap-3 mb-5">
            <motion.div
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 2, repeat: Infinity, repeatDelay: 1.5 }}
              className="w-11 h-11 rounded-full bg-red-100 dark:bg-red-900/40 flex items-center justify-center"
            >
              <Ban className="w-6 h-6 text-red-600 dark:text-red-400" />
            </motion.div>
            <div>
              <h2 className="text-xl font-bold font-poppins text-slate-800 dark:text-white">Crops to Avoid</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">Low probability of success with your current profile</p>
            </div>
          </div>
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
            {avoidCrops.map((pred, idx) => (
              <CropCard key={idx} pred={pred} idx={idx} isRecommended={false} />
            ))}
          </div>
        </motion.div>
      )}

    </div>
  );
};

export default ResultsCards;
