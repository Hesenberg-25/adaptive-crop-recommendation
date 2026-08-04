import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { History as HistoryIcon, Sprout, MapPin, Calendar, Loader2 } from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const History = () => {
  const { token } = useAuth();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const response = await axios.get('http://localhost:5000/api/predictions/history', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setHistory(response.data);
      } catch (error) {
        console.error("Failed to fetch history", error);
      } finally {
        setLoading(false);
      }
    };
    if (token) fetchHistory();
  }, [token]);

  return (
    <div className="mx-4 md:mx-auto max-w-6xl pb-20">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-panel p-8 w-full mb-8"
      >
        <h1 className="text-3xl font-bold font-poppins text-slate-800 dark:text-white flex items-center gap-3 mb-2 relative after:absolute after:bottom-[-8px] after:left-0 after:w-20 after:h-[3px] after:bg-gradient-to-r after:from-farm-primary after:to-farm-accent-gold">
          <HistoryIcon className="w-8 h-8 text-farm-primary" />
          Prediction History
        </h1>
        <p className="text-slate-600 dark:text-slate-400">
          Review your past AI crop recommendations and analysis.
        </p>
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
              className="glass-panel p-6 border-l-4 border-l-farm-primary hover:shadow-[0_8px_32px_rgba(139,105,20,0.12)] dark:hover:shadow-[0_8px_32px_rgba(0,0,0,0.3)] hover:-translate-y-1 transition-all"
            >
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Calendar className="w-4 h-4 text-slate-500" />
                    <span className="text-sm font-semibold text-slate-500 dark:text-slate-400">
                      {new Date(record.created_at).toLocaleDateString(undefined, {
                        year: 'numeric', month: 'long', day: 'numeric',
                        hour: '2-digit', minute: '2-digit'
                      })}
                    </span>
                  </div>
                  <h2 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2 capitalize mt-1">
                    <Sprout className="w-6 h-6 text-farm-primary-light" />
                    {record.recommended_crop}
                  </h2>
                </div>
                <div className="bg-slate-100 dark:bg-slate-800 rounded-xl p-3 text-sm flex gap-4 border border-slate-200 dark:border-slate-700">
                  <div className="flex flex-col">
                    <span className="text-slate-500 text-xs font-bold uppercase">N-P-K (mg/kg)</span>
                    <span className="font-mono text-slate-700 dark:text-slate-300">
                      {record.soil_n}-{record.soil_p}-{record.soil_k}
                    </span>
                  </div>
                  <div className="w-px bg-slate-300 dark:bg-slate-600"></div>
                  <div className="flex flex-col">
                    <span className="text-slate-500 text-xs font-bold uppercase">pH Level</span>
                    <span className="font-mono text-slate-700 dark:text-slate-300">{record.ph}</span>
                  </div>
                  {(record.lat && record.lon) && (
                    <>
                      <div className="w-px bg-slate-300 dark:bg-slate-600"></div>
                      <div className="flex flex-col">
                        <span className="text-slate-500 text-xs font-bold uppercase flex items-center gap-1">
                          <MapPin className="w-3 h-3" /> Location
                        </span>
                        <span className="font-mono text-slate-700 dark:text-slate-300">
                          {parseFloat(record.lat).toFixed(2)}, {parseFloat(record.lon).toFixed(2)}
                        </span>
                      </div>
                    </>
                  )}
                </div>
              </div>

              <div className="prose dark:prose-invert prose-emerald max-w-none text-sm mt-4 pt-4 border-t border-slate-200 dark:border-slate-800/50">
                <div className="font-semibold text-slate-700 dark:text-slate-300 mb-2">AI Insights Snapshot:</div>
                <div className="line-clamp-3 text-slate-600 dark:text-slate-400">
                  {record.advice || "No advice recorded for this simulation."}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default History;
