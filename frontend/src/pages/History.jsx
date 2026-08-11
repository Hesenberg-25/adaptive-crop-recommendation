import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  History as HistoryIcon, Sprout, MapPin, Calendar, Loader2,
  ChevronDown, Trash2
} from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import ResultsCards from '../components/ResultsCards';

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

const getFullResults = (record) => {
  if (!record) return null;
  if (record.full_results) {
    if (typeof record.full_results === 'string') {
      try {
        return JSON.parse(record.full_results);
      } catch (error) {
        console.warn('Unable to parse full_results JSON from history record', error);
      }
    } else {
      return record.full_results;
    }
  }

  if (record.advice) {
    const match = record.advice.match(/<!--_RESULTS_PAYLOAD_START_(.*?)_RESULTS_PAYLOAD_END_-->/s);
    if (match) {
      try {
        return JSON.parse(match[1]);
      } catch (error) {
        console.warn('Unable to parse embedded history payload from advice', error);
      }
    }
  }

  return null;
};

// ── Main History Page ──
const History = () => {
  const { token } = useAuth();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);
  const [pendingDeleteId, setPendingDeleteId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [deleteError, setDeleteError] = useState('');

  const toggleExpand = (id) => setExpandedId(expandedId === id ? null : id);

  const handleDeleteRequest = (event, id) => {
    event.stopPropagation();
    setDeleteError('');
    setPendingDeleteId(id);
  };

  const confirmDelete = async (id) => {
    setDeleteError('');
    setDeletingId(id);
    try {
      await axios.delete(`${import.meta.env.VITE_API_URL}/api/predictions/history/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setHistory(prev => prev.filter(record => record.id !== id));
      if (expandedId === id) setExpandedId(null);
    } catch (error) {
      setDeleteError('Unable to delete this record. Please try again.');
      console.error('Failed to delete history record', error);
    } finally {
      setDeletingId(null);
      setPendingDeleteId(null);
    }
  };

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
          {history.map((record) => {
            const fullResults = getFullResults(record);
            const cropTags = fullResults?.recommendedCrops?.slice(0, 3).map((crop) => (crop?.crop || crop?.name || '').trim()).filter(Boolean)
              || (record.recommended_crop || '').split(',').map((crop) => crop.trim()).filter(Boolean);

            return (
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
                      {cropTags.map((crop, idx) => (
                        <motion.span
                          key={idx}
                          whileHover={{ scale: 1.05 }}
                          className="inline-flex items-center gap-1.5 px-3 py-1 bg-farm-primary/10 text-farm-primary dark:text-farm-primary-light rounded-full font-semibold border border-farm-primary/20 capitalize text-sm"
                        >
                          <Sprout className="w-3.5 h-3.5" />
                          {crop}
                        </motion.span>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={(event) => handleDeleteRequest(event, record.id)}
                      disabled={deletingId === record.id}
                      className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 text-slate-600 hover:text-red-600 transition disabled:cursor-not-allowed disabled:opacity-60"
                      title="Delete prediction"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
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

                {pendingDeleteId === record.id && (
                  <div className="p-5 bg-red-50 dark:bg-red-950 border-t border-red-200 dark:border-red-800">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <p className="text-sm font-medium text-red-900 dark:text-red-100">
                        Confirm delete this prediction from your history?
                      </p>
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => confirmDelete(record.id)}
                          disabled={deletingId === record.id}
                          className="rounded-full bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700 disabled:opacity-60"
                        >
                          {deletingId === record.id ? 'Deleting...' : 'Delete'}
                        </button>
                        <button
                          type="button"
                          onClick={() => setPendingDeleteId(null)}
                          className="rounded-full border border-red-300 bg-white px-4 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-100 dark:border-red-700 dark:bg-red-950 dark:text-red-200 dark:hover:bg-red-900"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                    {deleteError && (
                      <p className="mt-3 text-sm text-red-700 dark:text-red-300">{deleteError}</p>
                    )}
                  </div>
                )}

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
                      <div className="p-6 border-t border-slate-200 dark:border-white/10">
                        {fullResults ? (
                          <>
                            {fullResults.weatherUsed?.dailyForecast?.length > 0 && (
                              <div className="mb-6">
                                <h4 className="text-lg font-semibold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                                  <span className="text-2xl">🌤️</span> 16-Day Weather Forecast
                                </h4>
                                <div className="flex gap-3 overflow-x-auto pb-2">
                                  {fullResults.weatherUsed.dailyForecast.map((day, idx) => (
                                    <div key={idx} className="shrink-0 w-24 bg-white dark:bg-[#1B2A17] p-3 rounded-xl border border-slate-200 dark:border-white/10 shadow-sm flex flex-col items-center gap-1">
                                      <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">
                                        {new Date(day.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                                      </span>
                                      <span className="text-2xl">{getWeatherEmoji(day.weatherCode)}</span>
                                      <div className="flex gap-2 text-[11px] font-bold">
                                        <span className="text-red-500">{Math.round(day.maxTemp)}°</span>
                                        <span className="text-blue-500">{Math.round(day.minTemp)}°</span>
                                      </div>
                                      <span className="text-[10px] text-cyan-600 dark:text-cyan-400 bg-cyan-50 dark:bg-cyan-900/30 px-1.5 py-0.5 rounded-full">
                                        {day.precipitation > 0 ? `${day.precipitation}mm` : '0mm'}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                            <ResultsCards
                              recommendedCrops={fullResults.recommendedCrops}
                              avoidCrops={fullResults.avoidCrops}
                              targetCropResult={fullResults.targetCropResult}
                            />
                          </>
                        ) : (
                          <div className="text-slate-600 dark:text-slate-400">Unable to render detailed prediction for this history item.</div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default History;
