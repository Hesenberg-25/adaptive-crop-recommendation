import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ScanSoilModal from '../components/ScanSoilModal';
import { Beaker } from 'lucide-react';
import toast from 'react-hot-toast';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const SoilScanPage = () => {
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(true);

  const { token } = useAuth();

  const handleClose = () => {
    setIsModalOpen(false);
    navigate('/dashboard');
  };

  return (
    <div className="max-w-5xl mx-auto pb-20 px-4 md:px-0 min-h-[80vh] flex flex-col items-center justify-center relative">
      <div className="text-center z-10">
        <div className="w-24 h-24 mb-6 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mx-auto shadow-inner">
          <Beaker className="w-12 h-12 text-emerald-500" />
        </div>
        <h1 className="text-3xl md:text-4xl font-extrabold font-poppins text-slate-800 dark:text-white mb-4">
          Soil Scan
        </h1>
        <p className="text-slate-500 dark:text-slate-400 font-medium max-w-md mx-auto">
          Opening the AI Soil Scanner... Please interact with the modal to capture or upload an image of your soil.
        </p>
      </div>

      <ScanSoilModal 
        isOpen={isModalOpen} 
        onClose={handleClose} 
      />
    </div>
  );
};

export default SoilScanPage;
