import { useState, useEffect, type ChangeEvent } from 'react';
import { useAuth } from '../context/AuthContext';

const EditWorkshop = ({ workshopId }: { workshopId: string }) => {
  useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState('');
  const [workshop, setWorkshop] = useState<any>(null);

  const fetchWorkshop = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:3000/admin/workshops`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        const ws = data.items.find((w: any) => w.id === workshopId);
        setWorkshop(ws);
      }
    } catch (error) {
      console.error('Failed to fetch workshop', error);
    }
  };

  useEffect(() => {
    fetchWorkshop();
    
    const interval = setInterval(() => {
      if (workshop && !workshop.aiSummary && workshop.status !== 'CANCELLED') {
        fetchWorkshop();
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [workshopId, workshop?.aiSummary]);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);
    setMessage('Uploading and processing...');

    const formData = new FormData();
    formData.append('file', file);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:3000/admin/workshops/${workshopId}/pdf`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        setMessage(data.message);
      } else {
        setMessage('Upload failed.');
      }
    } catch (error) {
      setMessage('An error occurred.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="p-6 max-w-2xl mx-auto bg-white rounded-2xl shadow-xl space-y-6 border border-gray-100 mt-10 transition-all hover:shadow-2xl">
      <div>
        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Workshop Settings</h1>
        <p className="mt-2 text-gray-500">Manage your workshop content and AI features.</p>
      </div>
      
      <div className="h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent"></div>

      <div className="space-y-4">
        <label className="block text-sm font-semibold text-gray-700 uppercase tracking-wider">
          Workshop Introduction PDF
        </label>
        
        <div className="group relative flex flex-col items-center justify-center p-8 border-2 border-dashed border-gray-300 rounded-xl bg-gray-50 transition-all hover:border-indigo-400 hover:bg-indigo-50/30">
          <input
            type="file"
            accept=".pdf"
            onChange={handleFileChange}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
          />
          
          <div className="flex flex-col items-center pointer-events-none">
            <div className="p-4 bg-white rounded-full shadow-sm mb-4 group-hover:scale-110 transition-transform">
              <svg className="w-8 h-8 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
            </div>
            <p className="text-sm font-medium text-gray-600">
              {file ? file.name : 'Click to upload or drag and drop'}
            </p>
            <p className="text-xs text-gray-400 mt-1">PDF files only (Max 10MB)</p>
          </div>
        </div>

        <div className="flex justify-end pt-4">
          <button
            onClick={handleUpload}
            disabled={!file || uploading}
            className={`flex items-center px-8 py-3 rounded-xl text-white font-bold transition-all transform
              ${!file || uploading 
                ? 'bg-gray-300 cursor-not-allowed grayscale' 
                : 'bg-indigo-600 hover:bg-indigo-700 active:scale-95 shadow-indigo-200 shadow-lg hover:shadow-indigo-300'}`}
          >
            {uploading ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Processing...
              </>
            ) : (
              'Upload & Summarize'
            )}
          </button>
        </div>
        
        {message && (
          <div className={`flex items-center p-4 rounded-xl text-sm font-medium animate-in fade-in slide-in-from-top-2
            ${message.includes('failed') || message.includes('error') 
              ? 'bg-red-50 text-red-700 border border-red-100' 
              : 'bg-green-50 text-green-700 border border-green-100'}`}>
            <svg className="w-5 h-5 mr-3" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            {message}
          </div>
        )}

        {workshop?.aiSummary && (
          <div className="mt-12 p-8 rounded-[2rem] bg-indigo-50/50 border border-indigo-100 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-400/5 rounded-full -mr-16 -mt-16 blur-2xl"></div>
            <h3 className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.3em] mb-6 flex items-center">
              <span className="w-8 h-[2px] bg-indigo-200 mr-3"></span>
              Generated AI Summary
            </h3>
            <p className="text-gray-700 text-lg font-medium leading-relaxed italic">
              "{workshop.aiSummary}"
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default EditWorkshop;
