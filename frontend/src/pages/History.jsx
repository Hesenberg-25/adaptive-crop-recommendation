import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  History as HistoryIcon, Sprout, MapPin, Calendar, Loader2,
  ChevronDown, ChevronUp, Ban, TrendingUp, IndianRupee, Droplets,
  Bug, Sparkles, FlaskConical, Leaf, Info, AlertCircle
} from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import ReactMarkdown from 'react-markdown';

// ── Inline Crop Image hook (same as ResultsCards) ──
const imageCache = {};
const useCropImage = (cropName) => {
  const [imgUrl, setImgUrl] = useState(null);
  useEffect(() => {
    if (!cropName) return;
    const key = cropName.toLowerCase();
    if (imageCache[key]) { setImgUrl(imageCache[key]); return; }
    const accessKey = import.meta.env.VITE_UNSPLASH_ACCESS_KEY;
    if (!accessKey) return;
    fetch(`https://api.unsplash.com/search/photos?query=${encodeURIComponent(key + ' crop farm')}&per_page=1&orientation=squarish&client_id=${accessKey}`)
      .then(r => r.json())
      .then(data => {
        const url = data?.results?.[0]?.urls?.small;
        if (url) { imageCache[key] = url; setImgUrl(url); }
        else setImgUrl('');
      })
      .catch(() => setImgUrl(''));
  }, [cropName]);
  return imgUrl;
};

// ── Mini Crop Card (same look as Dashboard) ──
const MiniCropCard = ({ pred, idx, isRecommended }) => {
  const cropImg = useCropImage(pred.crop || pred.name);
  const isTop = isRecommended && idx === 0;
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: idx * 0.08 }}
      className={`p-4 rounded-xl border relative overflow-hidden shadow ${
        isRecommended
          ? isTop
            ? 'bg-emerald-50 dark:bg-[#1B2A17] border-emerald-300 dark:border-emerald-700/50'
            : 'bg-white dark:bg-[#1B2A17]/80 border-slate-200 dark:border-white/10'
          : 'bg-red-50 dark:bg-[#2A1414]/80 border-red-200 dark:border-red-900'
      }`}
    >
      {isTop && <div className="absolute top-0 right-0 text-[10px] font-bold px-2 py-0.5 bg-farm-primary text-white rounded-bl-lg">★ Top</div>}
      <div className="flex items-center gap-3">
        <div className={`w-12 h-12 rounded-full overflow-hidden border-2 flex-shrink-0 flex items-center justify-center bg-slate-100 dark:bg-slate-800 ${isRecommended ? 'border-emerald-400' : 'border-red-400'}`}>
          {cropImg ? <img src={cropImg} alt={pred.crop || pred.name} className="w-full h-full object-cover" /> : <span className="text-xl">🌾</span>}
        </div>
        <div className="flex-grow min-w-0">
          <div className="font-bold capitalize text-slate-800 dark:text-white truncate">{pred.crop || pred.name}</div>
          <div className="flex items-center gap-2 mt-1">
            <div className="flex-grow bg-slate-200 dark:bg-white/10 rounded-full h-1.5">
              <div className={`h-1.5 rounded-full ${isRecommended ? 'bg-emerald-500' : 'bg-red-500'}`} style={{ width: `${pred.confidence}%` }} />
            </div>
            <span className={`text-xs font-bold font-mono ${isRecommended ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>{pred.confidence}%</span>
          </div>
        </div>
      </div>
      {pred.roi && (
        <div className="flex gap-2 mt-3">
          <span className="text-[10px] bg-white/60 dark:bg-black/20 px-2 py-0.5 rounded-full border border-slate-200 dark:border-white/10 flex items-center gap-0.5">
            <TrendingUp className="w-2.5 h-2.5 text-blue-500" /> {parseFloat(pred.roi) > 0 ? '+' : ''}{pred.roi}%
          </span>
          <span className="text-[10px] bg-white/60 dark:bg-black/20 px-2 py-0.5 rounded-full border border-slate-200 dark:border-white/10 flex items-center gap-0.5">
            <Droplets className="w-2.5 h-2.5 text-cyan-500" /> {pred.rainfallFit || 'N/A'}
          </span>
        </div>
      )}
    </motion.div>
  );
};

// ── Weather Code → Emoji ──
const getWeatherEmoji = (code) => {
  if (code === 0) return '☀️';
  if (code > 0 && code < 4) return '⛅';
  if (code >= 45 && code <= 48) return '🌫️';
  if (code >= 51 && code <= 67) return '🌧️';
  if (code >= 71 && code <= 77) return '❄️';
  if (code >= 80 && code <= 82) return '🌦️';
  if (code >= 95) return '⛈️';
  return '🌈';
};

// ── AI Advice parser (same as AIAdvice component) ──
const parseSections = (text) => {
  if (!text) return [];
  const headingRegex = /(?=#{1,3}\s)|(?=\*\*[A-Z][^*]{2,40}\*\*:)/g;
  const parts = text.split(headingRegex).filter(Boolean);
  if (parts.length <= 1) {
    const paras = text.split(/\n{2,}/).filter(p => p.trim().length > 20);
    if (paras.length <= 1) return [{ title: 'Expert Analysis', content: text }];
    return paras.map((p, i) => ({ title: `Insight ${i + 1}`, content: p.trim() }));
  }
  return parts.map((part, i) => {
    const lines = part.trim().split('\n');
    const title = lines[0].replace(/^#{1,3}\s*/, '').replace(/\*\*/g, '').replace(/:$/, '').trim();
    let content = lines.slice(1).join('\n').trim();
    if (!content) {
      if (title.length > 50) {
        content = title;
        return { title: `Insight ${i + 1}`, content };
      }
      return null;
    }
    return { title: title || `Insight ${i + 1}`, content };
  }).filter(Boolean);
};

// ── Expanded Record View (full dashboard style) ──
const ExpandedRecord = ({ record }) => {
  const advice = record.advice;
  const recommended = record.full_results?.recommendedCrops || [];
  const avoidCrops = record.full_results?.avoidCrops || [];
  const alerts = record.full_results?.alerts || [];
  const subsidies = record.full_results?.governmentSubsidies;
  const weatherUsed = record.full_results?.weatherUsed;
  const dailyForecast = weatherUsed?.dailyForecast;
  const aiSections = parseSections(advice);

  return (
    <div className="flex flex-col gap-6 p-6 border-t border-slate-200 dark:border-white/10">

      {/* Cropping Profile */}
      <div className="glass-panel p-5 bg-gradient-to-r from-farm-primary-light/10 to-transparent border-l-4 border-farm-primary">
        <h4 className="font-bold text-farm-primary mb-3 flex items-center gap-2"><span>📋</span> Cropping Profile</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
          {[
            { label: 'N-P-K', value: `${record.soil_n}-${record.soil_p}-${record.soil_k}` },
            { label: 'pH', value: record.ph },
            { label: 'Season', value: record.season || 'Auto' },
            { label: 'Technique', value: record.technique || '—' },
          ].map((item, i) => (
            <div key={i} className="bg-white/50 dark:bg-black/20 p-2.5 rounded-lg border border-white/20">
              <div className="text-[10px] text-slate-500 uppercase font-bold">{item.label}</div>
              <div className="font-semibold capitalize text-slate-800 dark:text-slate-200">{item.value}</div>
            </div>
          ))}
        </div>
      </div>

      {/* 16-Day Forecast */}
      {dailyForecast && dailyForecast.length > 0 && (
        <div>
          <h4 className="font-bold text-slate-800 dark:text-white mb-3 flex items-center gap-2"><span className="text-xl">🌤️</span> 16-Day Weather Forecast</h4>
          <div className="flex gap-3 overflow-x-auto pb-2">
            {dailyForecast.map((day, idx) => (
              <div key={idx} className="shrink-0 w-24 bg-white dark:bg-[#1B2A17] p-3 rounded-xl border border-slate-200 dark:border-white/10 shadow-sm flex flex-col items-center gap-1">
                <span className="text-[10px] font-semibold text-slate-500">{new Date(day.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</span>
                <span className="text-2xl my-1">{getWeatherEmoji(day.weatherCode)}</span>
                <div className="flex gap-2 text-[11px] font-bold font-mono">
                  <span className="text-red-500">{Math.round(day.maxTemp)}°</span>
                  <span className="text-blue-500">{Math.round(day.minTemp)}°</span>
                </div>
                <span className="text-[10px] text-cyan-600 dark:text-cyan-400 bg-cyan-50 dark:bg-cyan-900/30 px-1.5 py-0.5 rounded-full">{day.precipitation > 0 ? `${day.precipitation}mm` : '0mm'}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recommended Crops */}
      {recommended.length > 0 && (
        <div className="glass-panel p-5 border-l-4 border-emerald-500">
          <h4 className="font-bold text-slate-800 dark:text-white mb-3 flex items-center gap-2">
            <Sprout className="w-5 h-5 text-emerald-500" /> Highly Recommended Crops
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {recommended.map((pred, i) => <MiniCropCard key={i} pred={pred} idx={i} isRecommended={true} />)}
          </div>
        </div>
      )}

      {/* Avoid Crops */}
      {avoidCrops.length > 0 && (
        <div className="glass-panel p-5 border-l-4 border-red-500 !bg-red-50/50 dark:!bg-[#1F0F0F]/70">
          <h4 className="font-bold text-slate-800 dark:text-white mb-3 flex items-center gap-2">
            <Ban className="w-5 h-5 text-red-500" /> Crops to Avoid
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {avoidCrops.map((pred, i) => <MiniCropCard key={i} pred={pred} idx={i} isRecommended={false} />)}
          </div>
        </div>
      )}

      {/* Pest Alerts */}
      {alerts.length > 0 && (
        <div className="glass-panel p-5 border-l-4 border-amber-500">
          <h4 className="font-bold text-slate-800 dark:text-white mb-3 flex items-center gap-2">
            <Bug className="w-5 h-5 text-amber-500" /> Pest & Disease Risk
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {alerts.map((alert, i) => (
              <div key={i} className={`p-4 rounded-xl border-l-4 shadow-sm ${alert.severity === 'high' ? 'bg-red-50 dark:bg-[#2A1414] border-red-500' : 'bg-amber-50 dark:bg-[#2B2212] border-amber-500'}`}>
                <div className={`font-bold text-sm flex items-center justify-between mb-2 ${alert.severity === 'high' ? 'text-red-700 dark:text-red-300' : 'text-amber-700 dark:text-amber-300'}`}>
                  {alert.risk}
                  <span className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase ${alert.severity === 'high' ? 'bg-red-200 text-red-900 dark:bg-red-900/50 dark:text-red-200' : 'bg-amber-200 text-amber-900 dark:bg-amber-900/50 dark:text-amber-200'}`}>{alert.severity} RISK</span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">{alert.message}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* AI Insights */}
      {aiSections.length > 0 && (
        <div className="flex flex-col gap-3">
          <h4 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-400" /> Expert AI Insights
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {aiSections.map((section, i) => (
              <div key={i} className="glass-panel p-4">
                <div className="font-semibold text-sm text-slate-800 dark:text-white mb-2 font-poppins">{section.title}</div>
                <div className="prose prose-sm dark:prose-invert max-w-none text-slate-600 dark:text-slate-300 text-xs leading-relaxed font-lora">
                  <ReactMarkdown>{section.content}</ReactMarkdown>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Fallback: raw advice text if no full_results */}
      {!record.full_results && advice && aiSections.length === 0 && (
        <div className="glass-panel p-5">
          <div className="font-semibold text-slate-700 dark:text-slate-300 mb-2 text-base flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-400" /> AI Detailed Analysis
          </div>
          <div className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed whitespace-pre-wrap font-lora">{advice}</div>
        </div>
      )}
    </div>
  );
};

// ── Main History Page ──
const History = () => {
  const { token } = useAuth();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);

  const toggleExpand = (id) => setExpandedId(expandedId === id ? null : id);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/predictions/history`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setHistory(response.data);
      } catch (error) {
        console.error('Failed to fetch history', error);
      } finally {
        setLoading(false);
      }
    };
    if (token) fetchHistory();
  }, [token]);

  return (
    <div className="mx-4 md:mx-auto max-w-6xl pb-44">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-panel p-8 w-full mb-8"
      >
        <h1 className="text-3xl font-bold font-poppins text-slate-800 dark:text-white flex items-center gap-3 mb-2">
          <motion.div animate={{ rotate: [0, 10, -10, 0] }} transition={{ duration: 3, repeat: Infinity, repeatDelay: 3 }}>
            <HistoryIcon className="w-8 h-8 text-farm-primary" />
          </motion.div>
          Prediction History
        </h1>
        <p className="text-slate-600 dark:text-slate-400">Review your past AI crop recommendations and analysis.</p>
      </motion.div>

      {loading ? (
        <div className="flex justify-center items-center py-20">
          <Loader2 className="w-10 h-10 animate-spin text-emerald-500" />
        </div>
      ) : history.length === 0 ? (
        <div className="glass-panel py-20 text-center text-slate-500 dark:text-slate-400 italic font-lora">
          No prediction history found. Go to the Dashboard to run your first simulation!
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {history.map((record) => (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              key={record.id}
              className="glass-panel border-l-4 border-l-farm-primary hover:shadow-[0_8px_32px_rgba(139,105,20,0.12)] dark:hover:shadow-[0_8px_32px_rgba(0,0,0,0.3)] hover:-translate-y-1 transition-all overflow-hidden"
            >
              {/* Summary Row */}
              <div
                className="p-6 cursor-pointer flex flex-col md:flex-row md:items-start justify-between gap-4 select-none"
                onClick={() => toggleExpand(record.id)}
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar className="w-4 h-4 text-slate-500" />
                    <span className="text-sm font-semibold text-slate-500 dark:text-slate-400">
                      {new Date(record.created_at).toLocaleDateString(undefined, {
                        year: 'numeric', month: 'long', day: 'numeric',
                        hour: '2-digit', minute: '2-digit'
                      })}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {record.recommended_crop.split(',').map((crop, idx) => (
                      <motion.span
                        key={idx}
                        whileHover={{ scale: 1.05 }}
                        className="inline-flex items-center gap-1.5 px-3 py-1 bg-farm-primary/10 text-farm-primary dark:text-farm-primary-light rounded-full font-semibold border border-farm-primary/20 capitalize text-sm"
                      >
                        <Sprout className="w-3.5 h-3.5" />
                        {crop.trim()}
                      </motion.span>
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="bg-slate-100 dark:bg-slate-800 rounded-xl p-3 text-sm flex gap-4 border border-slate-200 dark:border-slate-700">
                    <div className="flex flex-col">
                      <span className="text-slate-500 text-[10px] font-bold uppercase">N-P-K</span>
                      <span className="font-mono text-slate-700 dark:text-slate-300">{record.soil_n}-{record.soil_p}-{record.soil_k}</span>
                    </div>
                    <div className="w-px bg-slate-300 dark:bg-slate-600" />
                    <div className="flex flex-col">
                      <span className="text-slate-500 text-[10px] font-bold uppercase">pH</span>
                      <span className="font-mono text-slate-700 dark:text-slate-300">{record.ph}</span>
                    </div>
                    {(record.lat && record.lon) && (
                      <>
                        <div className="w-px bg-slate-300 dark:bg-slate-600" />
                        <div className="flex flex-col">
                          <span className="text-slate-500 text-[10px] font-bold uppercase flex items-center gap-0.5"><MapPin className="w-2.5 h-2.5" /> Loc</span>
                          <span className="font-mono text-slate-700 dark:text-slate-300">{parseFloat(record.lat).toFixed(2)}, {parseFloat(record.lon).toFixed(2)}</span>
                        </div>
                      </>
                    )}
                  </div>
                  <motion.div
                    animate={{ rotate: expandedId === record.id ? 180 : 0 }}
                    transition={{ duration: 0.25 }}
                    className="text-slate-400"
                  >
                    <ChevronDown className="w-6 h-6" />
                  </motion.div>
                </div>
              </div>

              {/* Expanded Detail */}
              <AnimatePresence>
                {expandedId === record.id && (
                  <motion.div
                    key="detail"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden"
                  >
                    <ExpandedRecord record={record} />
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default History;
