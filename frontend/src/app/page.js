'use client';

import { useState } from 'react';
import axios from 'axios';
import {
  Upload,
  FileText,
  CheckCircle,
  AlertCircle,
  Download,
  Loader2,
  Camera,
  Image
} from 'lucide-react';

const API_URL = typeof window !== 'undefined' ? window.location.origin : '';

export default function Home() {
  const [step, setStep] = useState(1);
  const [menuFile, setMenuFile] = useState(null);
  const [menuText, setMenuText] = useState('');
  const [extractedData, setExtractedData] = useState(null);
  const [validation, setValidation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // ----- File / Text Handlers -----
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setMenuFile(file);
      setMenuText('');
      setError(null);
    }
  };

  const handleTextChange = (e) => {
    setMenuText(e.target.value);
    setMenuFile(null);
    setError(null);
  };

  // ----- Step 1: Extract Menu -----
  const handleExtract = async () => {
    setLoading(true);
    setError(null);

    try {
      const formData = new FormData();

      if (menuFile) formData.append('menuImage', menuFile);
      else if (menuText) formData.append('menuText', menuText);
      else throw new Error('Please upload an image or paste menu text');

      const response = await axios.post(
        `${API_URL}/api/menu/extract`,
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      );

      setExtractedData(response.data);
      setValidation(response.data.validation);
      setStep(2);
    } catch (err) {
      const errorMessage =
        err.response?.data?.error?.message ||
        err.response?.data?.error ||
        err.message ||
        'Extraction failed';
      setError(typeof errorMessage === 'string' ? errorMessage : JSON.stringify(errorMessage));
    } finally {
      setLoading(false);
    }
  };

  // ----- Step 2 & 3: Generate PDF and Download -----
  const handleGenerateAndDownload = async () => {
    if (!extractedData?.parsedMenu) {
      setError('No extracted menu available.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await axios.post(
        `${API_URL}/api/menu/generate`,
        {
          parsedMenu: extractedData.parsedMenu,
          menuDate: new Date().toISOString()
        },
        {
          responseType: 'blob', // Important: receive PDF as blob
          timeout: 180000
        }
      );

      // Convert blob to download
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.href = url;
      link.download = `menu-${Date.now()}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      // Move to step 3
      setStep(3);
    } catch (err) {
      console.error(err);
      setError('Failed to generate and download PDF. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setStep(1);
    setMenuFile(null);
    setMenuText('');
    setExtractedData(null);
    setValidation(null);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold text-gray-900">Elderly Care Menu Generator</h1>
          <p className="text-gray-600 mt-1">AI-powered daily menu creation with consistent design</p>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Step Indicators */}
        <div className="mb-8 flex items-center justify-center space-x-4">
          <StepIndicator number={1} active={step >= 1} label="Upload Menu" />
          <div className="w-16 h-1 bg-gray-300" />
          <StepIndicator number={2} active={step >= 2} label="Generate & Download" />
          <div className="w-16 h-1 bg-gray-300" />
          <StepIndicator number={3} active={step >= 3} label="Complete" />
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-start">
            <AlertCircle className="w-5 h-5 text-red-500 mr-3 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-red-900">Error</h3>
              <p className="text-red-700">{error}</p>
            </div>
          </div>
        )}

        {/* Step 1: Upload */}
        {step === 1 && (
          <div className="bg-white rounded-lg shadow-lg p-8">
            <h2 className="text-2xl font-bold mb-6 flex items-center">
              <Upload className="mr-2" />
              Upload Today's Menu
            </h2>
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Upload Menu Image</label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-500 transition">
                  <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" id="file-upload" />
                  <label htmlFor="file-upload" className="cursor-pointer">
                    {menuFile ? (
                      <div className="flex items-center justify-center text-blue-600">
                        <Image className="w-8 h-8 mr-2" />
                        <span className="font-medium">{menuFile.name}</span>
                      </div>
                    ) : (
                      <div>
                        <Camera className="w-12 h-12 mx-auto text-gray-400 mb-2" />
                        <p className="text-gray-600">Click to upload or drag and drop</p>
                        <p className="text-sm text-gray-400 mt-1">PNG, JPG, GIF up to 10MB</p>
                      </div>
                    )}
                  </label>
                </div>
              </div>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-white text-gray-500 font-medium">OR</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Paste Menu Text</label>
                <textarea
                  value={menuText}
                  onChange={handleTextChange}
                  rows={10}
                  placeholder="Paste your menu text here..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <button
                onClick={handleExtract}
                disabled={loading || (!menuFile && !menuText)}
                className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center transition"
              >
                {loading ? <><Loader2 className="w-5 h-5 mr-2 animate-spin" />Extracting...</> : <><FileText className="w-5 h-5 mr-2" />Extract Menu Content</>}
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Generate & Download */}
        {step === 2 && extractedData && (
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            <h2 className="text-2xl font-bold mb-4">Ready to Generate Menu PDF</h2>
            <p className="text-gray-600 mb-6">Click the button below to generate and download your PDF with images.</p>

            <button
              onClick={handleGenerateAndDownload}
              disabled={loading}
              className="w-full bg-blue-600 text-white py-4 px-6 rounded-lg font-semibold hover:bg-blue-700 flex items-center justify-center text-lg transition mb-4"
            >
              {loading ? 'Generating PDF...' : <><Download className="w-6 h-6 mr-2" />Generate & Download PDF</>}
            </button>

            <button
              onClick={handleReset}
              className="w-full bg-gray-200 text-gray-700 py-3 px-6 rounded-lg font-semibold hover:bg-gray-300 transition"
            >
              Start Over
            </button>
          </div>
        )}

        {/* Step 3: Complete */}
        {step === 3 && (
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4 mx-auto">
              <CheckCircle className="w-10 h-10 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Menu PDF Generated & Downloaded!</h2>
            <p className="text-gray-600 mb-6">You can now start over to generate another menu.</p>
            <button
              onClick={handleReset}
              className="w-full bg-gray-200 text-gray-700 py-3 px-6 rounded-lg font-semibold hover:bg-gray-300 transition"
            >
              Generate Another Menu
            </button>
          </div>
        )}
      </main>
    </div>
  );
}

// ----- Step Indicator -----
function StepIndicator({ number, active, label }) {
  return (
    <div className="flex flex-col items-center">
      <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg ${active ? 'bg-blue-600 text-white' : 'bg-gray-300 text-gray-600'}`}>
        {number}
      </div>
      <span className={`text-sm mt-2 ${active ? 'text-blue-600 font-semibold' : 'text-gray-500'}`}>{label}</span>
    </div>
  );
}
