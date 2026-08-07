import React, { useState, useRef } from 'react';
import { Mic, MicOff, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const VoiceInput = ({ onValuesExtracted, language = 'en' }) => {
  const { token } = useAuth();
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [processing, setProcessing] = useState(false);
  const recognitionRef = useRef(null);

  const isSupported = typeof window !== 'undefined' &&
    (window.SpeechRecognition || window.webkitSpeechRecognition);

  const startListening = () => {
    if (!isSupported) {
      toast.error('Voice input is not supported in this browser. Try Chrome.');
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    const langMap = {
      'en': 'en-IN',
      'hi': 'hi-IN',
      'mr': 'mr-IN',
      'ta': 'ta-IN',
      'te': 'te-IN',
      'kn': 'kn-IN',
      'gu': 'gu-IN',
      'bn': 'bn-IN',
      'pa': 'pa-IN',
      'ml': 'ml-IN',
      'or': 'or-IN'
    };
    recognition.lang = langMap[language] || 'en-IN';

    recognition.onresult = (event) => {
      let text = '';
      for (let i = 0; i < event.results.length; i++) {
        text += event.results[i][0].transcript;
      }
      setTranscript(text);
    };

    recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      toast.error('Could not hear you clearly. Please try again.');
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;
    setTranscript('');
    setIsListening(true);
    recognition.start();
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsListening(false);
  };

  const submitTranscript = async () => {
    if (!transcript.trim()) return;
    setProcessing(true);
    try {
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/parse-voice`,
        { transcript },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const { extracted, summary } = response.data;
      if (extracted && Object.keys(extracted).length > 0) {
        onValuesExtracted(extracted);
        toast.success(summary || 'Values updated from voice input!');
        setTranscript('');
      } else {
        toast.error(summary || "Didn't catch any specific values — try mentioning a parameter like nitrogen or temperature.");
      }
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to process voice input');
    } finally {
      setProcessing(false);
    }
  };

  if (!isSupported) return null; // gracefully hide on unsupported browsers

  return (
    <div className="flex flex-col gap-2 w-full">
      <div className="flex items-center gap-3">
        <motion.button
          type="button"
          onClick={isListening ? stopListening : startListening}
          whileTap={{ scale: 0.92 }}
          className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 transition-colors shadow-md ${
            isListening
              ? 'bg-red-500 text-white animate-pulse'
              : 'bg-emerald-600 text-white hover:bg-emerald-700'
          }`}
          title={isListening ? 'Stop listening' : 'Speak your soil/weather conditions'}
        >
          {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
        </motion.button>

        <div className="flex-1 min-h-[3rem] px-4 py-2 rounded-xl bg-white/60 dark:bg-black/20 border border-white/20 flex items-center text-sm text-slate-700 dark:text-slate-300 font-lora italic">
          {transcript || (isListening ? 'Listening...' : 'Tap the mic and describe your soil, e.g. "high nitrogen and very hot today"')}
        </div>
      </div>

      <AnimatePresence>
        {transcript && !isListening && (
          <motion.button
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            type="button"
            onClick={submitTranscript}
            disabled={processing}
            className="w-full py-2.5 rounded-xl bg-farm-primary text-white font-semibold text-sm flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
          >
            {processing ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            {processing ? 'Understanding...' : 'Use these values'}
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
};

export default VoiceInput;
