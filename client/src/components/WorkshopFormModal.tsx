import React, { useState, useEffect } from 'react';

interface Workshop {
  id: string;
  title: string;
  description?: string;
  room: string;
  startTime: string;
  capacity: number;
  price: number;
  category: string;
  aiSummary?: string | null;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  workshop?: Workshop | null;
}

const WorkshopFormModal: React.FC<Props> = ({ isOpen, onClose, onSuccess, workshop }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    room: '',
    startTime: '',
    capacity: 0,
    price: 0,
    category: '',
  });
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'details' | 'summary'>('details');
  
  // AI Summary states
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState('');
  const [aiSummary, setAiSummary] = useState<string | null>(workshop?.aiSummary || null);
  const [isQueued, setIsQueued] = useState(false);

  useEffect(() => {
    if (workshop) {
      setFormData({
        title: workshop.title,
        description: workshop.description || '',
        room: workshop.room,
        startTime: new Date(workshop.startTime).toISOString().slice(0, 16),
        capacity: workshop.capacity,
        price: workshop.price,
        category: workshop.category,
      });
      setAiSummary(workshop.aiSummary || null);
    } else {
      setFormData({
        title: '',
        description: '',
        room: '',
        startTime: '',
        capacity: 0,
        price: 0,
        category: '',
      });
      setAiSummary(null);
    }
    setActiveTab('details');
    setFile(null);
    setUploadMessage('');
    setIsQueued(false);
  }, [workshop, isOpen]);

  // Polling for summary
  useEffect(() => {
    let interval: any;
    if (isOpen && activeTab === 'summary' && workshop && !aiSummary) {
      interval = setInterval(async () => {
        try {
          const token = localStorage.getItem('token');
          const response = await fetch(`http://localhost:3000/admin/workshops`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (response.ok) {
            const data = await response.json();
            const ws = data.items.find((w: any) => w.id === workshop.id);
            if (ws?.aiSummary) {
              setAiSummary(ws.aiSummary);
              setIsQueued(false);
              setUploadMessage('Summary generation completed!');
            }
          }
        } catch (e) {
          console.error('Polling failed', e);
        }
      }, 5000);
    }
    return () => clearInterval(interval);
  }, [isOpen, activeTab, workshop, aiSummary]);

  if (!isOpen) return null;

  const handleUpload = async () => {
    if (!file || !workshop) return;

    setUploading(true);
    setUploadMessage('Uploading and processing...');

    const formData = new FormData();
    formData.append('file', file);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:3000/admin/workshops/${workshop.id}/pdf`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (response.ok) {
        setUploadMessage('PDF uploaded. Summary is being generated...');
        setIsQueued(true);
      } else {
        setUploadMessage('Upload failed.');
      }
    } catch (error) {
      setUploadMessage('An error occurred.');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const url = workshop 
        ? `http://localhost:3000/admin/workshops/${workshop.id}` 
        : 'http://localhost:3000/admin/workshops';
      const method = workshop ? 'PATCH' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...formData,
          capacity: Number(formData.capacity),
          price: Number(formData.price),
          startTime: new Date(formData.startTime).toISOString(),
        }),
      });

      if (response.ok) {
        onSuccess();
        onClose();
      }
    } catch (error) {
      console.error('Failed to save workshop', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-xl rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in slide-in-from-bottom-8 duration-500">
        <div className="p-8 space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-black text-gray-900 tracking-tight">
              {workshop ? 'Edit Workshop' : 'Create New Workshop'}
            </h2>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
              <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {workshop && (
            <div className="flex p-1 bg-gray-100 rounded-xl">
              <button
                onClick={() => setActiveTab('details')}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${activeTab === 'details' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
              >
                Details
              </button>
              <button
                onClick={() => setActiveTab('summary')}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${activeTab === 'summary' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
              >
                AI Summary
              </button>
            </div>
          )}

          {activeTab === 'details' ? (
            <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Title</label>
                <input
                  required
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all outline-none"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Category</label>
                <input
                  required
                  type="text"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all outline-none"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all outline-none h-24 resize-none"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Room</label>
                <input
                  required
                  type="text"
                  value={formData.room}
                  onChange={(e) => setFormData({ ...formData, room: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all outline-none"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Start Time</label>
                <input
                  required
                  type="datetime-local"
                  value={formData.startTime}
                  onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Capacity</label>
                <input
                  required
                  type="number"
                  value={formData.capacity}
                  onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) })}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all outline-none"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Price (đ)</label>
                <input
                  required
                  type="number"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: parseInt(e.target.value) })}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all outline-none"
                />
              </div>
            </div>

            <div className="flex gap-4 pt-6">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-6 py-4 bg-gray-100 hover:bg-gray-200 text-gray-600 font-bold rounded-2xl transition-all"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-2 px-12 py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl shadow-lg shadow-indigo-100 transition-all active:scale-95 disabled:grayscale"
              >
                {loading ? 'Saving...' : workshop ? 'Update Workshop' : 'Create Workshop'}
              </button>
            </div>
          </form>
          ) : (
            <div className="space-y-6 py-4">
              <div className="space-y-4">
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">
                  Upload Workshop Introduction PDF
                </label>
                <div className="group relative flex flex-col items-center justify-center p-8 border-2 border-dashed border-gray-200 rounded-2xl bg-gray-50 transition-all hover:border-indigo-300 hover:bg-indigo-50/30">
                  <input
                    type="file"
                    accept=".pdf"
                    onChange={(e) => e.target.files && setFile(e.target.files[0])}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  />
                  <div className="flex flex-col items-center pointer-events-none">
                    <svg className="w-8 h-8 text-indigo-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    <p className="text-sm font-bold text-gray-600">{file ? file.name : 'Select PDF file'}</p>
                  </div>
                </div>
                <button
                  onClick={handleUpload}
                  disabled={!file || uploading || isQueued}
                  className="w-full py-4 bg-indigo-600 text-white font-bold rounded-2xl shadow-lg disabled:grayscale transition-all active:scale-95"
                >
                  {uploading ? 'Uploading PDF...' : isQueued ? 'In Queue (Processing...)' : 'Upload & Generate Summary'}
                </button>
                {uploadMessage && (
                  <div className={`p-4 rounded-xl text-center space-y-2 ${uploadMessage.includes('failed') ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600'}`}>
                    <p className="text-xs font-black uppercase tracking-widest">{isQueued ? 'Processing' : 'Status'}</p>
                    <p className="text-sm font-bold">{uploadMessage}</p>
                    {isQueued && (
                      <div className="flex justify-center space-x-1">
                        <div className="w-1 h-1 bg-emerald-400 rounded-full animate-bounce"></div>
                        <div className="w-1 h-1 bg-emerald-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                        <div className="w-1 h-1 bg-emerald-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {aiSummary && (
                <div className="p-6 bg-indigo-50 rounded-2xl border border-indigo-100">
                  <h4 className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-3">AI Summary</h4>
                  <p className="text-sm text-gray-700 font-medium leading-relaxed italic">"{aiSummary}"</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default WorkshopFormModal;
