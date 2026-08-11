import React, { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, Heart, Thermometer, Droplets, Timer, FlaskConical,
  Sprout, Bug, Leaf, ChevronLeft, ChevronRight, Download, Flower2,
  TrendingUp, CalendarDays, SunMedium, CloudRain, Layers, Loader2
} from 'lucide-react';
import CROP_DETAILS from '../data/cropDetailData';
import { generateCropReportPDF } from '../utils/pdfExport';

const categoryColorMap = {
  'Cereal':     { bg: 'bg-amber-600',   text: 'text-white' },
  'Pulse':      { bg: 'bg-lime-600',    text: 'text-white' },
  'Vegetable':  { bg: 'bg-emerald-600', text: 'text-white' },
  'Fruit':      { bg: 'bg-rose-600',    text: 'text-white' },
  'Cash Crop':  { bg: 'bg-purple-600',  text: 'text-white' },
};

// In-memory image cache
const imgCache = {};

const useMultiCropImages = (cropName, query, count = 5) => {
  const [images, setImages] = useState([]);

  useEffect(() => {
    if (!cropName) return;
    const key = cropName.toLowerCase();

    if (imgCache[key] && imgCache[key].length >= count) {
      setImages(imgCache[key]);
      return;
    }

    const accessKey = import.meta.env.VITE_UNSPLASH_ACCESS_KEY;
    if (!accessKey) return;

    fetch(
      `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query || key + ' crop farm')}&per_page=${count}&orientation=landscape&client_id=${accessKey}`
    )
      .then(r => r.json())
      .then(data => {
        const urls = (data?.results || []).map(r => r?.urls?.regular || r?.urls?.small).filter(Boolean);
        if (urls.length > 0) {
          imgCache[key] = urls;
          setImages(urls);
        }
      })
      .catch(() => setImages([]));
  }, [cropName, query, count]);

  return images;
};


const CropDetailView = ({ crop, onBack, isFavorite, onToggleFavorite }) => {
  const detail = CROP_DETAILS[crop.name];
  const [activeImageIdx, setActiveImageIdx] = useState(0);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  const images = useMultiCropImages(
    crop.name,
    detail?.unsplashQuery,
    5
  );

  const nextImage = useCallback(() => {
    if (images.length > 0) setActiveImageIdx(i => (i + 1) % images.length);
  }, [images.length]);

  const prevImage = useCallback(() => {
    if (images.length > 0) setActiveImageIdx(i => (i - 1 + images.length) % images.length);
  }, [images.length]);

  if (!detail) {
    return (
      <motion.div
        initial={{ x: '100%', opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: '100%', opacity: 0 }}
        transition={{ type: 'spring', stiffness: 80, damping: 18 }}
        className="max-w-5xl mx-auto px-4 pt-24 pb-20"
      >
        <button onClick={onBack} className="flex items-center gap-2 mb-6 text-farm-primary hover:underline font-semibold">
          <ArrowLeft className="w-5 h-5" /> Back to Catalog
        </button>
        <div className="glass-panel p-12 text-center">
          <span className="text-5xl mb-4 block">{crop.emoji}</span>
          <h2 className="text-2xl font-bold font-poppins text-slate-800 dark:text-white mb-2">{crop.name}</h2>
          <p className="text-slate-500 dark:text-slate-400">Detailed information for this crop is coming soon.</p>
        </div>
      </motion.div>
    );
  }

  const catColor = categoryColorMap[crop.category] || categoryColorMap['Cereal'];

  return (
    <motion.div
      initial={{ x: '100%', opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: '100%', opacity: 0 }}
      transition={{ type: 'spring', stiffness: 80, damping: 18 }}
      className="max-w-5xl mx-auto px-4 pt-24 pb-20"
    >
      {/* Back Button */}
      <motion.button
        onClick={onBack}
        whileHover={{ x: -4 }}
        className="flex items-center gap-2 mb-5 text-farm-primary hover:text-farm-primary-light font-semibold text-sm transition-colors group"
      >
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
        Back to Catalog
      </motion.button>

      {/* Main Card */}
      <div className="glass-panel overflow-hidden">
        {/* ── Hero Section ── */}
        <div className="flex flex-col lg:flex-row">
          {/* Left — Image Gallery */}
          <div className="relative lg:w-[40%] min-h-[280px] lg:min-h-[380px] bg-gradient-to-br from-emerald-900/30 to-emerald-800/10">
            {/* Category Badge */}
            <div className={`absolute top-4 left-4 z-10 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold ${catColor.bg} ${catColor.text} shadow-lg`}>
              <Leaf className="w-3.5 h-3.5" />
              {crop.category}
            </div>

            {/* Main Image */}
            <AnimatePresence mode="wait">
              {images.length > 0 ? (
                <motion.img
                  key={activeImageIdx}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  src={images[activeImageIdx]}
                  alt={crop.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-emerald-100 to-emerald-50 dark:from-emerald-900/40 dark:to-emerald-950/30">
                  <span className="text-7xl">{crop.emoji}</span>
                </div>
              )}
            </AnimatePresence>

            {/* Image Navigation */}
            {images.length > 1 && (
              <>
                <button onClick={prevImage} className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/40 hover:bg-black/60 text-white flex items-center justify-center transition-colors backdrop-blur-sm">
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button onClick={nextImage} className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/40 hover:bg-black/60 text-white flex items-center justify-center transition-colors backdrop-blur-sm">
                  <ChevronRight className="w-4 h-4" />
                </button>

                {/* Counter */}
                <div className="absolute bottom-14 left-4 bg-black/50 text-white text-xs font-bold px-2.5 py-1 rounded-full backdrop-blur-sm flex items-center gap-1">
                  📷 {activeImageIdx + 1} / {images.length}
                </div>
              </>
            )}

            {/* Thumbnails */}
            {images.length > 1 && (
              <div className="absolute bottom-2 left-2 right-2 flex gap-1.5 overflow-x-auto py-1">
                {images.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveImageIdx(i)}
                    className={`w-12 h-12 rounded-lg overflow-hidden border-2 flex-shrink-0 transition-all ${
                      i === activeImageIdx
                        ? 'border-white shadow-lg scale-105'
                        : 'border-transparent opacity-70 hover:opacity-100'
                    }`}
                  >
                    <img src={img} alt={`${crop.name} ${i + 1}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right — Crop Info */}
          <div className="flex-1 p-6 lg:p-8">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h1 className="text-3xl lg:text-4xl font-extrabold font-poppins text-slate-800 dark:text-white uppercase tracking-wide">
                  {crop.name}
                </h1>
                <p className="text-sm text-slate-500 dark:text-slate-400 italic mt-1">{detail.scientificName}</p>
              </div>

              {/* Save Crop Button */}
              <motion.button
                whileTap={{ scale: 0.85 }}
                whileHover={{ scale: 1.05 }}
                onClick={() => onToggleFavorite(crop.name)}
                className="flex flex-col items-center gap-1 group"
              >
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border-2 transition-all ${
                  isFavorite
                    ? 'bg-red-50 dark:bg-red-900/30 border-red-300 dark:border-red-700'
                    : 'bg-white/50 dark:bg-white/5 border-slate-200 dark:border-white/10 hover:border-red-300'
                }`}>
                  <Heart
                    className={`w-6 h-6 transition-colors ${
                      isFavorite ? 'text-red-500 fill-red-500' : 'text-slate-400 group-hover:text-red-400'
                    }`}
                  />
                </div>
                <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">
                  {isFavorite ? 'Saved' : 'Save Crop'}
                </span>
              </motion.button>
            </div>

            {/* Quick Stats — Market Trend + Sowing Season */}
            <div className="flex flex-wrap gap-3 mb-5">
              <div className="flex items-center gap-3 px-4 py-2.5 rounded-2xl border border-slate-200 dark:border-white/10 bg-white/40 dark:bg-white/5">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center">
                  <TrendingUp className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                  <div className="text-[10px] text-slate-400 font-bold uppercase">Market Trend</div>
                  <div className="text-sm font-bold text-slate-800 dark:text-white">
                    ₹{detail.marketTrend.min} – ₹{detail.marketTrend.max} / {detail.marketTrend.unit}
                    {detail.marketTrend.direction === 'up' && <span className="text-emerald-500 ml-1">↗</span>}
                    {detail.marketTrend.direction === 'stable' && <span className="text-amber-500 ml-1">→</span>}
                    {detail.marketTrend.direction === 'down' && <span className="text-red-500 ml-1">↘</span>}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 px-4 py-2.5 rounded-2xl border border-slate-200 dark:border-white/10 bg-white/40 dark:bg-white/5">
                <div className="w-8 h-8 rounded-xl bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center">
                  <CalendarDays className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                </div>
                <div>
                  <div className="text-[10px] text-slate-400 font-bold uppercase">Sowing Season</div>
                  <div className="text-sm font-bold text-slate-800 dark:text-white">{detail.sowingSeason}</div>
                </div>
              </div>
            </div>

            {/* Environment Row — 5 icons */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 mb-5">
              {[
                { icon: <Thermometer className="w-4 h-4" />, label: 'Climate', value: detail.climate.tempRange, color: 'text-orange-500' },
                { icon: <Layers className="w-4 h-4" />, label: 'Soil Type', value: detail.soilType, color: 'text-amber-700 dark:text-amber-400' },
                { icon: <CloudRain className="w-4 h-4" />, label: 'Water', value: detail.water, color: 'text-blue-500' },
                { icon: <Timer className="w-4 h-4" />, label: 'Duration', value: `${detail.duration} Days`, color: 'text-emerald-600 dark:text-emerald-400' },
                { icon: <FlaskConical className="w-4 h-4" />, label: 'pH', value: detail.ph, color: 'text-purple-500' },
              ].map((item, i) => (
                <div key={i} className="flex flex-col items-center text-center p-2.5 rounded-xl bg-white/30 dark:bg-white/5 border border-slate-100 dark:border-white/5">
                  <span className={`${item.color} mb-1`}>{item.icon}</span>
                  <span className="text-[10px] font-bold text-slate-400 uppercase">{item.label}</span>
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-200 mt-0.5 leading-tight">{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Information Cards Section ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 p-5 lg:p-6">
          {/* Fertilizer Requirement Card */}
          <div className="rounded-2xl border-2 border-emerald-200 dark:border-emerald-800/40 bg-white/30 dark:bg-white/5 p-5">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-7 h-7 rounded-lg bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center">
                <Sprout className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              </div>
              <h3 className="text-sm font-bold text-slate-800 dark:text-white">Fertilizer Requirement</h3>
            </div>

            <p className="text-[10px] font-bold text-slate-400 uppercase mb-3">Recommended Dose (per acre)</p>

            <div className="space-y-2.5">
              {[
                { label: `FYM ($Farm Yard Manure)`, value: detail.fertilizer.fym },
                { label: `$Nitrogen (N)`, value: detail.fertilizer.nitrogen },
                { label: `$Phosphorus (P₂O₅)`, value: detail.fertilizer.phosphorus },
                { label: `$Potassium (K₂O)`, value: detail.fertilizer.potassium },
              ].map((row, i) => (
                <div key={i} className="flex justify-between items-center py-1.5 border-b border-slate-100 dark:border-white/5 last:border-none">
                  <span className="text-xs text-slate-600 dark:text-slate-300">{row.label}</span>
                  <span className="text-xs font-bold text-slate-800 dark:text-white">{row.value}</span>
                </div>
              ))}
            </div>

            {/* Application Schedule */}
            <div className="mt-5 pt-4 border-t border-slate-200 dark:border-white/10">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-6 h-6 rounded-lg bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center">
                  <CalendarDays className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <h4 className="text-xs font-bold text-slate-800 dark:text-white">Application Schedule</h4>
              </div>
              <div className="space-y-2">
                {detail.applicationSchedule.map((step, i) => (
                  <div key={i} className="flex items-start gap-2.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 mt-1 flex-shrink-0 shadow-[0_0_6px_rgba(16,185,129,0.4)]" />
                    <span className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">{step}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Other Information Card */}
          <div className="rounded-2xl border-2 border-emerald-200 dark:border-emerald-800/40 bg-white/30 dark:bg-white/5 p-5">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-7 h-7 rounded-lg bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center">
                <Flower2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              </div>
              <h3 className="text-sm font-bold text-slate-800 dark:text-white">Other Information</h3>
            </div>

            <div className="space-y-4">
              {[
                { icon: <Sprout className="w-3.5 h-3.5 text-emerald-500" />, label: 'Sowing Method', value: detail.otherInfo.sowingMethod },
                { icon: <Layers className="w-3.5 h-3.5 text-emerald-500" />, label: 'Spacing', value: detail.otherInfo.spacing },
                { icon: <Droplets className="w-3.5 h-3.5 text-blue-500" />, label: 'Irrigation', value: detail.otherInfo.irrigation },
                { icon: <Bug className="w-3.5 h-3.5 text-red-500" />, label: 'Common Pests', value: detail.otherInfo.commonPests },
                { icon: <SunMedium className="w-3.5 h-3.5 text-amber-500" />, label: 'Common Diseases', value: detail.otherInfo.commonDiseases },
                { icon: <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />, label: 'Expected Yield', value: detail.otherInfo.expectedYield },
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-lg bg-slate-100 dark:bg-white/5 flex items-center justify-center flex-shrink-0 mt-0.5">
                    {item.icon}
                  </div>
                  <div>
                    <div className="text-[10px] font-bold text-slate-400 uppercase">{item.label}</div>
                    <div className="text-xs text-slate-700 dark:text-slate-200 font-medium leading-relaxed">{item.value}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── About Section + Download Report ── */}
        <div className="px-5 lg:px-6 pb-5 lg:pb-6 flex flex-col sm:flex-row sm:items-end gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Leaf className="w-4 h-4 text-emerald-500" />
              <h3 className="text-sm font-bold text-slate-800 dark:text-white">
                About {crop.name}
              </h3>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">{detail.about}</p>
          </div>

          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            className={`glass-button !py-2.5 !px-5 !text-sm flex items-center gap-2 flex-shrink-0 ${isGeneratingPdf ? 'opacity-50 cursor-not-allowed' : ''}`}
            disabled={isGeneratingPdf}
            onClick={async () => {
              try {
                setIsGeneratingPdf(true);
                // Wrap in setTimeout to allow UI to update to loading state
                await new Promise(resolve => setTimeout(resolve, 100)); 
                generateCropReportPDF(crop, detail);
                toast.success('Report downloaded successfully!');
              } catch (err) {
                console.error("PDF Generation Error:", err);
                toast.error('Failed to generate PDF. Please try again.');
              } finally {
                setIsGeneratingPdf(false);
              }
            }}
          >
            {isGeneratingPdf ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            {isGeneratingPdf ? 'Generating...' : 'Download Report'}
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
};

export default CropDetailView;
