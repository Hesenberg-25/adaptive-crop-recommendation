import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, Upload, Image as ImageIcon, Loader2, AlertCircle, CheckCircle2, ShieldAlert, Bug, Stethoscope, Leaf } from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const DiseaseDetection = () => {
  const { token } = useAuth();
  
  const [activeTab, setActiveTab] = useState('upload'); // 'camera' or 'upload'
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState(null);
  const [scanResult, setScanResult] = useState(null);

  // Camera State
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const [cameraError, setCameraError] = useState(null);

  // Upload State
  const fileInputRef = useRef(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  }, []);

  const startCamera = useCallback(async () => {
    setCameraError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error('Camera access error:', err);
      setCameraError('Camera access denied or unavailable. Please use the Upload option.');
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'camera' && !scanResult) {
      startCamera();
    } else {
      stopCamera();
    }
    return () => stopCamera();
  }, [activeTab, scanResult, startCamera, stopCamera]);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setError(null);
    if (tab === 'upload') {
      setSelectedFile(null);
      setPreviewUrl(null);
    }
  };

  const fileToBase64 = (file) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = error => reject(error);
    reader.readAsDataURL(file);
  });

  const handleCapture = async () => {
    if (!videoRef.current) return;
    
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
    
    const base64Image = canvas.toDataURL('image/jpeg', 0.8);
    setPreviewUrl(base64Image); // Show what was captured
    await submitImage(base64Image, 'image/jpeg');
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setError("Please select a valid image file.");
        return;
      }
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setError(null);
    }
  };

  const handleUploadSubmit = async () => {
    if (!selectedFile) return;
    const base64Image = await fileToBase64(selectedFile);
    await submitImage(base64Image, selectedFile.type);
  };

  const submitImage = async (base64Image, mimeType) => {
    setIsScanning(true);
    setError(null);
    stopCamera(); 

    try {
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/vision/analyze-disease`,
        { image: base64Image, mimeType },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setScanResult(response.data);
      toast.success("Analysis complete!");
    } catch (err) {
      console.error(err);
      setError('Failed to analyze image. Please try again.');
      if (activeTab === 'camera') startCamera(); 
    } finally {
      setIsScanning(false);
    }
  };

  const handleReset = () => {
    setScanResult(null);
    setSelectedFile(null);
    setPreviewUrl(null);
    setError(null);
    if (activeTab === 'camera') {
      startCamera();
    }
  };

  return (
    <div className="max-w-5xl mx-auto pb-20">
      <div className="mb-8 px-4 md:px-0">
        <h1 className="text-3xl md:text-4xl font-extrabold font-poppins text-slate-800 dark:text-white flex items-center gap-3">
          <Stethoscope className="w-8 h-8 text-rose-500" />
          Disease Detection
        </h1>
        <p className="text-slate-500 dark:text-slate-400 mt-2 font-medium">
          Upload or capture a photo of a crop leaf, plant, or soil to instantly identify pests, diseases, or soil-related issues, and receive actionable organic and chemical treatment recommendations.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 px-4 md:px-0">
        {/* Left Column: Input / Image Preview */}
        <div className="flex flex-col gap-6">
          <div className="glass-panel bg-white/90 dark:bg-[#111A0E]/95 rounded-[2rem] p-6 shadow-xl border border-slate-200 dark:border-white/10">
            {!scanResult && (
              <div className="flex mb-6 gap-2 bg-slate-100 dark:bg-black/20 p-1 rounded-2xl">
                <TabButton 
                  active={activeTab === 'upload'} 
                  onClick={() => handleTabChange('upload')} 
                  icon={<Upload className="w-4 h-4"/>} 
                  label="Upload Photo" 
                  disabled={isScanning} 
                />
                <TabButton 
                  active={activeTab === 'camera'} 
                  onClick={() => handleTabChange('camera')} 
                  icon={<Camera className="w-4 h-4"/>} 
                  label="Use Camera" 
                  disabled={isScanning} 
                />
              </div>
            )}

            {error && (
              <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-300 rounded-xl text-sm flex items-center gap-3 border border-red-100 dark:border-red-900/50">
                <AlertCircle className="w-5 h-5 flex-shrink-0" /> {error}
              </div>
            )}

            <div className="relative">
              {isScanning ? (
                <div className="h-80 flex flex-col items-center justify-center gap-6 bg-slate-50 dark:bg-black/20 rounded-2xl border-2 border-dashed border-rose-300 dark:border-rose-700/50">
                   <div className="relative">
                      <div className="absolute inset-0 border-4 border-rose-500/20 rounded-full animate-ping"></div>
                      <Loader2 className="w-14 h-14 text-rose-500 animate-spin relative z-10" />
                   </div>
                   <p className="font-bold text-rose-600 dark:text-rose-400 font-mono animate-pulse">Analyzing image...</p>
                </div>
              ) : scanResult || (activeTab === 'upload' && previewUrl) ? (
                 <div className="flex flex-col gap-4">
                    <div className="relative rounded-2xl overflow-hidden bg-black h-80 shadow-inner group">
                       <img src={previewUrl} alt="Preview" className="w-full h-full object-contain" />
                       {!scanResult && (
                         <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <button onClick={() => { setSelectedFile(null); setPreviewUrl(null); }} className="px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-lg backdrop-blur-md text-sm font-bold">
                              Change Image
                            </button>
                         </div>
                       )}
                    </div>
                    {!scanResult && activeTab === 'upload' && (
                       <button 
                         onClick={handleUploadSubmit} 
                         disabled={!selectedFile}
                         className="w-full py-4 bg-rose-500 hover:bg-rose-600 text-white font-bold rounded-xl shadow-lg shadow-rose-500/30 transition-all active:scale-95 flex justify-center items-center gap-2"
                       >
                         <ShieldAlert className="w-5 h-5" /> Analyze Image
                       </button>
                    )}
                 </div>
              ) : activeTab === 'camera' ? (
                <div className="flex flex-col gap-4">
                  {cameraError ? (
                    <div className="h-80 flex flex-col items-center justify-center gap-3 bg-slate-100 dark:bg-black/20 rounded-2xl border-2 border-slate-200 dark:border-white/10 text-center p-6">
                      <Camera className="w-10 h-10 text-slate-400" />
                      <p className="text-sm text-slate-500 font-medium">{cameraError}</p>
                    </div>
                  ) : (
                    <div className="relative rounded-2xl overflow-hidden bg-black h-80 shadow-inner">
                      <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
                      <div className="absolute inset-0 border-[3px] border-rose-500/30 rounded-2xl pointer-events-none"></div>
                      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24 border-2 border-white/50 rounded-xl pointer-events-none"></div>
                    </div>
                  )}
                  <button 
                    onClick={handleCapture} 
                    disabled={!!cameraError}
                    className="w-full py-4 bg-rose-500 hover:bg-rose-600 text-white font-bold rounded-xl shadow-lg shadow-rose-500/30 transition-all active:scale-95 flex justify-center items-center gap-2 disabled:opacity-50"
                  >
                    <Camera className="w-5 h-5" /> Capture & Analyze
                  </button>
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="h-80 flex flex-col items-center justify-center gap-4 bg-slate-50 hover:bg-slate-100 dark:bg-black/20 dark:hover:bg-black/40 cursor-pointer rounded-2xl border-2 border-dashed border-slate-300 dark:border-white/20 transition-all group"
                  >
                    <div className="w-20 h-20 rounded-full bg-rose-50 dark:bg-rose-900/30 flex items-center justify-center group-hover:scale-110 transition-transform shadow-sm">
                      <ImageIcon className="w-10 h-10 text-rose-500" />
                    </div>
                    <div className="text-center">
                      <p className="font-bold text-slate-700 dark:text-slate-300 text-lg">Click to upload photo</p>
                      <p className="text-sm text-slate-500 mt-2 font-medium">JPEG, PNG, WEBP (Max 5MB)</p>
                    </div>
                  </div>
                  <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
                </div>
              )}
            </div>

            {scanResult && (
               <button 
                 onClick={handleReset} 
                 className="w-full mt-6 py-4 bg-slate-100 hover:bg-slate-200 dark:bg-white/10 dark:hover:bg-white/20 text-slate-700 dark:text-white font-bold rounded-xl transition-all active:scale-95 flex justify-center items-center gap-2"
               >
                 <Upload className="w-5 h-5" /> Scan Another Image
               </button>
            )}
          </div>
        </div>

        {/* Right Column: Results Dashboard */}
        <div className="flex flex-col gap-6">
          <AnimatePresence mode="wait">
            {scanResult ? (
              <motion.div 
                key="results"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="flex flex-col gap-6 h-full"
              >
                {/* Main Identity Card */}
                <div className={`glass-panel rounded-[2rem] p-8 shadow-xl border ${scanResult.diseaseName?.toLowerCase() === 'healthy' ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-rose-500/10 border-rose-500/30'} flex flex-col gap-4 relative overflow-hidden`}>
                  <div className={`absolute top-0 right-0 w-32 h-32 blur-3xl rounded-full opacity-50 ${scanResult.diseaseName?.toLowerCase() === 'healthy' ? 'bg-emerald-500' : 'bg-rose-500'}`}></div>
                  
                  <div className="flex items-start justify-between relative z-10">
                    <div>
                      <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">Diagnosis</h2>
                      <h3 className={`text-3xl font-black font-poppins ${scanResult.diseaseName?.toLowerCase() === 'healthy' ? 'text-emerald-700 dark:text-emerald-400' : 'text-rose-700 dark:text-rose-400'}`}>
                        {scanResult.diseaseName || 'Unknown Issue'}
                      </h3>
                    </div>
                    <div className="bg-white dark:bg-black/40 px-4 py-2 rounded-2xl shadow-sm flex flex-col items-center">
                      <span className="text-2xl font-black text-slate-800 dark:text-white">{scanResult.confidence}%</span>
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Confidence</span>
                    </div>
                  </div>

                  <p className="text-slate-700 dark:text-slate-300 font-medium leading-relaxed relative z-10">
                    {scanResult.description}
                  </p>
                </div>

                {/* Recommendations Grid */}
                {scanResult.diseaseName?.toLowerCase() !== 'healthy' && (
                  <div className="grid grid-cols-1 gap-6">
                    {/* Organic Treatments */}
                    {scanResult.organicTreatments && scanResult.organicTreatments.length > 0 && (
                      <div className="glass-panel bg-white/90 dark:bg-[#111A0E]/95 rounded-[1.5rem] p-6 shadow-lg border border-emerald-200 dark:border-emerald-900/30">
                        <h4 className="flex items-center gap-2 font-bold text-emerald-600 dark:text-emerald-400 mb-4">
                          <Leaf className="w-5 h-5" /> Organic Treatments
                        </h4>
                        <ul className="space-y-3">
                          {scanResult.organicTreatments.map((treatment, idx) => (
                            <li key={idx} className="flex gap-3 text-slate-700 dark:text-slate-300 font-medium text-sm items-start">
                              <span className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center flex-shrink-0 mt-0.5 text-emerald-600 dark:text-emerald-400 text-xs">✓</span>
                              {treatment}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Chemical Treatments */}
                    {scanResult.chemicalTreatments && scanResult.chemicalTreatments.length > 0 && (
                      <div className="glass-panel bg-white/90 dark:bg-[#111A0E]/95 rounded-[1.5rem] p-6 shadow-lg border border-amber-200 dark:border-amber-900/30">
                        <h4 className="flex items-center gap-2 font-bold text-amber-600 dark:text-amber-500 mb-4">
                          <ShieldAlert className="w-5 h-5" /> Chemical Treatments
                        </h4>
                        <ul className="space-y-3">
                          {scanResult.chemicalTreatments.map((treatment, idx) => (
                            <li key={idx} className="flex gap-3 text-slate-700 dark:text-slate-300 font-medium text-sm items-start">
                              <span className="w-5 h-5 rounded-full bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center flex-shrink-0 mt-0.5 text-amber-600 dark:text-amber-500 text-xs">!</span>
                              {treatment}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Preventative Measures */}
                    {scanResult.preventativeMeasures && scanResult.preventativeMeasures.length > 0 && (
                      <div className="glass-panel bg-white/90 dark:bg-[#111A0E]/95 rounded-[1.5rem] p-6 shadow-lg border border-blue-200 dark:border-blue-900/30">
                        <h4 className="flex items-center gap-2 font-bold text-blue-600 dark:text-blue-400 mb-4">
                          <CheckCircle2 className="w-5 h-5" /> Preventative Measures
                        </h4>
                        <ul className="space-y-3">
                          {scanResult.preventativeMeasures.map((measure, idx) => (
                            <li key={idx} className="flex gap-3 text-slate-700 dark:text-slate-300 font-medium text-sm items-start">
                              <span className="w-1.5 h-1.5 rounded-full bg-blue-400 flex-shrink-0 mt-2"></span>
                              {measure}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </motion.div>
            ) : (
              <motion.div 
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="h-full flex flex-col items-center justify-center text-center p-10 glass-panel bg-white/50 dark:bg-[#111A0E]/50 rounded-[2rem] border border-slate-200 dark:border-white/5"
              >
                <div className="w-24 h-24 mb-6 rounded-full bg-slate-100 dark:bg-white/5 flex items-center justify-center shadow-inner">
                  <Bug className="w-12 h-12 text-slate-300 dark:text-slate-600" />
                </div>
                <h3 className="text-xl font-bold text-slate-700 dark:text-slate-300 mb-2">No Image Analyzed</h3>
                <p className="text-slate-500 dark:text-slate-400 font-medium max-w-sm">
                  Upload or capture a photo of a crop leaf, plant, or soil to see the diagnosis and treatment recommendations here.
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

const TabButton = ({ active, onClick, icon, label, disabled }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm transition-all ${
      active 
        ? 'bg-white dark:bg-slate-800 shadow text-rose-600 dark:text-rose-400' 
        : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300 hover:bg-black/5 dark:hover:bg-white/5'
    } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
  >
    {icon} {label}
  </button>
);

export default DiseaseDetection;
