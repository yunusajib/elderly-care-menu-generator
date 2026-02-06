'use client';

import { useState } from 'react';
import axios from 'axios';
import { Upload, FileText, CheckCircle, AlertCircle, Download, Loader2, Camera, Image } from 'lucide-react';

// ✅ FIXED: Simplified API URL - always uses current domain
const API_URL = typeof window !== 'undefined' ? window.location.origin : '';

export default function Home() {
  const [step, setStep] = useState(1); // 1: Upload, 2: Review, 3: Generate, 4: Complete
  const [menuFile, setMenuFile] = useState(null);
  const [menuText, setMenuText] = useState('');
  const [extractedData, setExtractedData] = useState(null);
  const [validation, setValidation] = useState(null);
  const [generatedMenu, setGeneratedMenu] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Step 1: Upload menu image or paste text
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

  const handleExtract = async () => {
    setLoading(true);
    setError(null);

    try {
      const formData = new FormData();

      if (menuFile) {
        formData.append('menuImage', menuFile);
      } else if (menuText) {
        formData.append('menuText', menuText);
      } else {
        throw new Error('Please upload an image or paste menu text');
      }

      // ✅ FIXED: Now calls /api/menu/extract correctly
      const response = await axios.post(`${API_URL}/api/menu/extract`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      setExtractedData(response.data);
      setValidation(response.data.validation);
      setStep(2);
    } catch (err) {
      const errorMessage = err.response?.data?.error?.message
        || err.response?.data?.error
        || err.message
        || 'Extraction failed';
      setError(typeof errorMessage === 'string' ? errorMessage : JSON.stringify(errorMessage));
    } finally {
      setLoading(false);
    }
  };

  // Step 3: Generate menu with images
  const handleGenerate = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await axios.post(`${API_URL}/api/menu/generate`, {
        parsedMenu: extractedData.parsedMenu,
        menuDate: new Date().toISOString()
      }, {
        timeout: 180000 // 3 minutes timeout
      });

      setGeneratedMenu(response.data);
      setStep(3);
    } catch (err) {
      console.error('Generation error:', err);

      let errorMessage;

      if (err.response?.data?.error) {
        const backendError = err.response.data.error;
        errorMessage = typeof backendError === 'string'
          ? backendError
          : backendError.message || JSON.stringify(backendError);
      } else if (err.code === 'ECONNABORTED') {
        errorMessage = 'Request timeout - image generation is taking too long. Please try again.';
      } else if (err.message) {
        errorMessage = err.message;
      } else {
        errorMessage = 'Generation failed';
      }

      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Download PDF
  const handleDownload = () => {
    if (generatedMenu?.pdf?.downloadUrl) {
      window.open(`${API_URL}${generatedMenu.pdf.downloadUrl}`, '_blank');
    }
  };

  // Reset to start over
  const handleReset = () => {
    setStep(1);
    setMenuFile(null);
    setMenuText('');
    setExtractedData(null);
    setValidation(null);
    setGeneratedMenu(null);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold text-gray-900">
            Elderly Care Menu Generator
          </h1>
          <p className="text-gray-600 mt-1">
            AI-powered daily menu creation with consistent design
          </p>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-center space-x-4">
            <StepIndicator number={1} active={step >= 1} label="Upload Menu" />
            <div className="w-16 h-1 bg-gray-300" />
            <StepIndicator number={2} active={step >= 2} label="Review & Validate" />
            <div className="w-16 h-1 bg-gray-300" />
            <StepIndicator number={3} active={step >= 3} label="Download PDF" />
          </div>
        </div>

        {/* Error Display */}
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
              {/* File Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Upload Menu Image
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-500 transition">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                    id="file-upload"
                  />
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

              {/* OR Divider */}
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-white text-gray-500 font-medium">OR</span>
                </div>
              </div>

              {/* Text Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Paste Menu Text
                </label>
                <textarea
                  value={menuText}
                  onChange={handleTextChange}
                  rows={10}
                  placeholder="Paste your menu text here..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Extract Button */}
              <button
                onClick={handleExtract}
                disabled={loading || (!menuFile && !menuText)}
                className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center transition"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Extracting...
                  </>
                ) : (
                  <>
                    <FileText className="w-5 h-5 mr-2" />
                    Extract Menu Content
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Review */}
        {step === 2 && extractedData && (
          <div className="bg-white rounded-lg shadow-lg p-8">
            <h2 className="text-2xl font-bold mb-6">Review Extracted Menu</h2>

            {/* Validation Status */}
            <div className={`mb-6 p-4 rounded-lg ${validation.valid ? 'bg-green-50 border border-green-200' : 'bg-yellow-50 border border-yellow-200'
              }`}>
              <div className="flex items-start">
                {validation.valid ? (
                  <CheckCircle className="w-6 h-6 text-green-500 mr-3 flex-shrink-0" />
                ) : (
                  <AlertCircle className="w-6 h-6 text-yellow-500 mr-3 flex-shrink-0" />
                )}
                <div className="flex-1">
                  <h3 className="font-semibold text-lg">
                    {validation.valid ? 'Validation Passed ✓' : 'Validation Warnings'}
                  </h3>
                  <p className="text-sm mt-1">
                    Found {validation.sectionCount} sections with {validation.totalItems} items
                  </p>
                  {validation.errors.length > 0 && (
                    <ul className="mt-2 space-y-1">
                      {validation.errors.map((error, i) => (
                        <li key={i} className="text-red-600 text-sm">• {error}</li>
                      ))}
                    </ul>
                  )}
                  {validation.warnings.length > 0 && (
                    <ul className="mt-2 space-y-1">
                      {validation.warnings.map((warning, i) => (
                        <li key={i} className="text-yellow-600 text-sm">• {warning}</li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </div>

            {/* Extracted Sections */}
            <div className="space-y-4 mb-6">
              {Object.entries(generatedMenu.images).map(([key, image]) => (
                <div key={key} className="border rounded-lg overflow-hidden">
                  <div className="aspect-square bg-gray-100 flex items-center justify-center">
                    {image.localPath ? (
                      <img
                        src={`${API_URL}${image.localPath.replace('./cache', '/cache')}`}
                        alt={image.mealDescription}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="text-gray-400 text-xs p-4 text-center">
                        Image generation failed
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>


            {/* Action Buttons */}
            <div className="flex space-x-4">
              <button
                onClick={handleReset}
                className="flex-1 bg-gray-200 text-gray-700 py-3 px-6 rounded-lg font-semibold hover:bg-gray-300 transition"
              >
                Start Over
              </button>
              <button
                onClick={handleGenerate}
                disabled={loading}
                className="flex-1 bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-300 flex items-center justify-center transition"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Generating Menu...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-5 h-5 mr-2" />
                    Generate Menu with Images
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Complete */}
        {step === 3 && generatedMenu && (
          <div className="bg-white rounded-lg shadow-lg p-8">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
                <CheckCircle className="w-10 h-10 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold mb-2">Menu Generated Successfully!</h2>
              <p className="text-gray-600 mb-6">
                Generated in {generatedMenu.generationTime}s with {Object.keys(generatedMenu.images).length} images
              </p>

              {/* Generated Images Preview */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
                {Object.entries(generatedMenu.images).map(([key, image]) => (
                  <div key={key} className="border rounded-lg overflow-hidden">
                    <div className="aspect-square bg-gray-100 flex items-center justify-center">
                      <img
                        src={`${API_URL}${image.localPath.replace('./cache', '/cache')}`}
                        alt={image.mealDescription}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="p-2 bg-gray-50">
                      <p className="text-xs font-semibold capitalize">{key}</p>
                      <p className="text-xs text-gray-600 truncate">{image.mealDescription}</p>
                      {image.cached && (
                        <span className="text-xs text-green-600">♻️ Cached</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Download Button */}
              <button
                onClick={handleDownload}
                className="w-full bg-blue-600 text-white py-4 px-6 rounded-lg font-semibold hover:bg-blue-700 flex items-center justify-center text-lg transition mb-4"
              >
                <Download className="w-6 h-6 mr-2" />
                Download Menu PDF
              </button>

              <button
                onClick={handleReset}
                className="w-full bg-gray-200 text-gray-700 py-3 px-6 rounded-lg font-semibold hover:bg-gray-300 transition"
              >
                Generate Another Menu
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white mt-12 py-6 border-t">
        <div className="max-w-7xl mx-auto px-4 text-center text-gray-600 text-sm">
          <p>Elderly Care Menu Generator • AI-Powered • Consistent Design</p>
        </div>
      </footer>
    </div>
  );
}

// Step Indicator Component
function StepIndicator({ number, active, label }) {
  return (
    <div className="flex flex-col items-center">
      <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg ${active ? 'bg-blue-600 text-white' : 'bg-gray-300 text-gray-600'
        }`}>
        {number}
      </div>
      <span className={`text-sm mt-2 ${active ? 'text-blue-600 font-semibold' : 'text-gray-500'}`}>
        {label}
      </span>
    </div>
  );
}