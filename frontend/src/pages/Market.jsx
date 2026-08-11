import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import TopBar from '../components/TopBar';
import { Search, MapPin, Map, Filter, TrendingUp, TrendingDown, IndianRupee, Loader2 } from 'lucide-react';
import clsx from 'clsx';

const STATES = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka", "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal"
];

const COMMODITIES = [
  "Rice", "Wheat", "Maize", "Bajra(Pearl Millet/Cumbu)", "Jowar(Sorghum)", "Onion", "Potato", "Tomato", "Cotton", "Sugarcane", "Groundnut", "Soyabean", "Turmeric", "Garlic", "Ginger", "Apple", "Banana", "Mango", "Grapes", "Pomegranate", "Orange", "Papaya"
];

export default function Market() {
  const { token } = useAuth();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Filters
  const [state, setState] = useState('');
  const [district, setDistrict] = useState('');
  const [commodity, setCommodity] = useState('');
  
  const fetchMarketData = async () => {
    if (!token) return;
    
    setLoading(true);
    setError('');
    try {
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/market/prices`,
        { state, district, commodity, limit: 100 },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      if (response.data.error) {
        setError(response.data.error);
      } else {
        setData(response.data.records || []);
      }
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Failed to fetch market data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMarketData();
  }, [token]);

  const handleSubmit = (e) => {
    if (e) e.preventDefault();
    fetchMarketData();
  };

  return (
    <div className="flex flex-col h-full bg-transparent overflow-y-auto w-full">
      
      <div className="p-4 md:p-8 max-w-7xl mx-auto w-full space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-slate-800 dark:text-farm-text-heading font-poppins flex items-center gap-2">
              <TrendingUp className="text-emerald-500 w-8 h-8" /> Live Mandi Market
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Real-time agricultural commodity prices from APMC markets across India.</p>
          </div>
        </div>

        <div className="bg-white dark:bg-[#131F10] p-4 md:p-6 rounded-2xl border border-slate-200 dark:border-white/5 shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Map className="w-3.5 h-3.5" /> State
              </label>
              <select
                name="state"
                value={state}
                onChange={(e) => setState(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-black/20 text-slate-800 dark:text-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
              >
                <option value="">All States</option>
                {STATES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5" /> District
              </label>
              <input
                type="text"
                name="district"
                placeholder="e.g. Pune (Optional)"
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-black/20 text-slate-800 dark:text-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all placeholder:text-slate-400"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Filter className="w-3.5 h-3.5" /> Commodity
              </label>
              <select
                name="commodity"
                value={commodity}
                onChange={(e) => setCommodity(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-black/20 text-slate-800 dark:text-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
              >
                <option value="">All Commodities</option>
                {COMMODITIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            <button
              type="button"
              onClick={handleSubmit}
              disabled={loading}
              className="w-full bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-2.5 px-4 rounded-xl shadow-lg shadow-emerald-500/30 transition-all flex items-center justify-center gap-2 h-[46px]"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Search className="w-5 h-5" /> Search Prices</>}
            </button>
          </div>
        </div>

        {error && (
          <div className="p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl border border-red-100 dark:border-red-900/30 text-sm font-medium">
            {error}
          </div>
        )}

        <div className="bg-white dark:bg-[#131F10] rounded-2xl border border-slate-200 dark:border-white/5 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-black/40 border-b border-slate-200 dark:border-white/5">
                  <th className="p-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Commodity</th>
                  <th className="p-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Market (District)</th>
                  <th className="p-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Arrival Date</th>
                  <th className="p-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Min Price</th>
                  <th className="p-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Max Price</th>
                  <th className="p-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-right">Modal Price (₹/Qtl)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                {loading ? (
                  Array(5).fill(0).map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td className="p-4"><div className="h-4 bg-slate-200 dark:bg-white/10 rounded w-24"></div></td>
                      <td className="p-4"><div className="h-4 bg-slate-200 dark:bg-white/10 rounded w-32"></div></td>
                      <td className="p-4"><div className="h-4 bg-slate-200 dark:bg-white/10 rounded w-20"></div></td>
                      <td className="p-4"><div className="h-4 bg-slate-200 dark:bg-white/10 rounded w-16"></div></td>
                      <td className="p-4"><div className="h-4 bg-slate-200 dark:bg-white/10 rounded w-16"></div></td>
                      <td className="p-4 text-right"><div className="h-4 bg-slate-200 dark:bg-white/10 rounded w-20 ml-auto"></div></td>
                    </tr>
                  ))
                ) : data.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="p-8 text-center text-slate-500 dark:text-slate-400 font-medium">
                      No market records found for the selected filters.
                    </td>
                  </tr>
                ) : (
                  data.map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                      <td className="p-4">
                        <div className="font-bold text-slate-800 dark:text-white">{row.commodity}</div>
                        <div className="text-xs text-slate-500">{row.variety} ({row.grade})</div>
                      </td>
                      <td className="p-4">
                        <div className="font-medium text-slate-700 dark:text-slate-300">{row.market}</div>
                        <div className="text-xs text-slate-500">{row.district}, {row.state}</div>
                      </td>
                      <td className="p-4 text-sm font-medium text-slate-600 dark:text-slate-400">{row.arrival_date}</td>
                      <td className="p-4 text-sm font-medium text-red-500">₹{row.min_price}</td>
                      <td className="p-4 text-sm font-medium text-emerald-500">₹{row.max_price}</td>
                      <td className="p-4 text-right">
                        <div className="inline-flex items-center gap-1.5 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-3 py-1 rounded-lg font-bold">
                          <IndianRupee className="w-3.5 h-3.5" />
                          {row.modal_price}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
