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
const CropCard = ({ pred, idx, isRecommended }) => {
  const isTop = isRecommended && idx === 0;
  const cropImg = useCropImage(pred.crop || pred.name);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: idx * 0.12, type: 'spring', stiffness: 100 }}
      className={clsx(
        'p-5 rounded-2xl border relative transition-all shadow-lg overflow-hidden',
        isRecommended
          ? isTop
            ? 'bg-gradient-to-br from-emerald-50 to-white dark:from-[#1B2A17] dark:to-[#111A0E] border-emerald-300 dark:border-emerald-700/50 shadow-[0_4px_20px_rgba(111,166,87,0.18)]'
            : 'bg-white dark:bg-[#1B2A17]/90 border-slate-200 dark:border-white/10'
          : 'bg-[#FFF4F0] dark:bg-[#2A1414]/90 border-[#F0C4C4] dark:border-[#4A2020]'
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

      <div className="flex gap-4 items-center mb-4">
        {/* Circular Crop Image */}
        <motion.div
          whileHover={{ scale: 1.08 }}
          className={clsx(
            'w-20 h-20 rounded-full overflow-hidden border-4 shadow-md flex-shrink-0 bg-slate-100 dark:bg-slate-800 flex items-center justify-center border-glow',
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

        <div className="flex-grow">
          <div className="flex justify-between items-center">
            <h3 className={clsx('text-xl font-extrabold capitalize font-poppins', isRecommended ? 'text-slate-800 dark:text-white' : 'text-red-800 dark:text-red-200')}>
              {pred.crop || pred.name}
            </h3>
            <div className="text-right">
              <div className={clsx('text-xl font-bold font-mono', isRecommended ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400')}>
                {pred.confidence}%
              </div>
              <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Match</div>
            </div>
          </div>
          <div className={clsx('w-full rounded-full h-2 mt-2', isRecommended ? 'bg-slate-200 dark:bg-white/10' : 'bg-red-100 dark:bg-black/30')}>
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${pred.confidence}%` }}
              transition={{ duration: 1, delay: idx * 0.12 + 0.3 }}
              className={clsx('h-2 rounded-full', isRecommended ? 'bg-gradient-to-r from-emerald-400 to-farm-primary' : 'bg-gradient-to-r from-red-400 to-red-600')}
            />
          </div>
        </div>
      </div>

      {/* Financial Data */}
      {pred.roi && (
        <div className="grid grid-cols-3 gap-2 mb-3">
          {[
            { icon: <TrendingUp className="w-3.5 h-3.5 text-blue-500 icon-pulse" />, label: 'ROI', value: `${parseFloat(pred.roi) > 0 ? '+' : ''}${pred.roi}%`, positive: parseFloat(pred.roi) > 0 },
            { icon: <IndianRupee className="w-3.5 h-3.5 text-emerald-500 icon-pulse" />, label: 'Net/ha', value: `${pred.netReturnPerHectare > 0 ? '+' : ''}₹${Number(pred.netReturnPerHectare || 0).toLocaleString('en-IN')}`, positive: pred.netReturnPerHectare > 0 },
            { icon: <Droplets className="w-3.5 h-3.5 text-cyan-500 icon-pulse" />, label: 'Rain Fit', value: pred.rainfallFit || 'N/A', positive: pred.rainfallFit === 'High' },
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
      )}

      {!isRecommended && pred.avoidReason && (
        <div className="flex items-start gap-2 text-sm border-l-4 border-red-500 pl-3 p-3 bg-red-50 dark:bg-red-900/20 rounded-r-xl mb-3">
          <Ban className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
          <span className="text-red-800 dark:text-red-200 font-medium">{pred.avoidReason}</span>
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
    </motion.div>
  );
};

const ResultsCards = ({ recommendedCrops, avoidCrops }) => {
  if ((!recommendedCrops || recommendedCrops.length === 0) && (!avoidCrops || avoidCrops.length === 0)) {
    return null;
  }

  return (
    <div className="flex flex-col gap-8 w-full">

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
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
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
