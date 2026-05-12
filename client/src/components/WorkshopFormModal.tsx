import React, { useState, useEffect } from 'react';

interface Workshop {
  id: string;
  title: string;
  description?: string;
  room: string;
  startTime: string;
  endTime: string;
  capacity: number;
  price: number;
  category: string;
  speakerName?: string;
  speakerAvatar?: string;
  speakerInfo?: string;
  roomDiagramUrl?: string;
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
    endTime: '',
    capacity: 0,
    price: 0,
    category: '',
    speakerName: '',
    speakerAvatar: '',
    speakerInfo: '',
    roomDiagramUrl: '',
  });
  const [loading, setLoading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState('');
  const [isQueued, setIsQueued] = useState(false);
  const [aiSummary, setAiSummary] = useState<string | null>(workshop?.aiSummary || null);

  useEffect(() => {
    if (workshop) {
      setFormData({
        title: workshop.title,
        description: workshop.description || '',
        room: workshop.room,
        startTime: new Date(workshop.startTime).toISOString().slice(0, 16),
        endTime: new Date(workshop.endTime).toISOString().slice(0, 16),
        capacity: workshop.capacity,
        price: workshop.price,
        category: workshop.category,
        speakerName: workshop.speakerName || '',
        speakerAvatar: workshop.speakerAvatar || '',
        speakerInfo: workshop.speakerInfo || '',
        roomDiagramUrl: workshop.roomDiagramUrl || '',
      });
      setAiSummary(workshop.aiSummary || null);
    } else {
      setFormData({
        title: '',
        description: '',
        room: '',
        startTime: '',
        endTime: '',
        capacity: 0,
        price: 0,
        category: '',
        speakerName: '',
        speakerAvatar: '',
        speakerInfo: '',
        roomDiagramUrl: '',
      });
      setAiSummary(null);
    }
  }, [workshop, isOpen]);

  // Polling for summary
  useEffect(() => {
    let interval: any;
    if (isOpen && workshop && !aiSummary && isQueued) {
      interval = setInterval(async () => {
        try {
          const token = localStorage.getItem('token');
          const response = await fetch(`http://localhost:3000/staff-portal/workshops`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (response.ok) {
            const data = await response.json();
            const ws = data.items.find((w: any) => w.id === workshop.id);
            if (ws?.aiSummary) {
              setAiSummary(ws.aiSummary);
              setIsQueued(false);
              setUploadMessage('Summary generation completed!');
              onSuccess(); // Refresh parent to sync summary
            }
          }
        } catch (e) {
          console.error('Polling failed', e);
        }
      }, 3000);
    }
    return () => clearInterval(interval);
  }, [isOpen, workshop, aiSummary, isQueued]);

  if (!isOpen) return null;

  const handleUpload = async () => {
    if (!file || !workshop) return;

    setUploading(true);
    setUploadMessage('Uploading and processing...');

    const uploadFormData = new FormData();
    uploadFormData.append('file', file);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:3000/staff-portal/workshops/${workshop.id}/pdf`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: uploadFormData,
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
        ? `http://localhost:3000/staff-portal/workshops/${workshop.id}` 
        : 'http://localhost:3000/staff-portal/workshops';
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
          endTime: new Date(formData.endTime).toISOString(),
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
        <div className="p-8 space-y-6 max-h-[90vh] overflow-y-auto">
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
                  {/* Empty space for grid alignment or add another field */}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">End Time</label>
                  <input
                    required
                    type="datetime-local"
                    value={formData.endTime}
                    onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
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

              <div className="border-t border-gray-100 pt-4 mt-4">
                <h3 className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-4">Speaker Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Speaker Name</label>
                    <input
                      type="text"
                      value={formData.speakerName}
                      onChange={(e) => setFormData({ ...formData, speakerName: e.target.value })}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Speaker Avatar URL</label>
                    <input
                      type="text"
                      value={formData.speakerAvatar}
                      onChange={(e) => setFormData({ ...formData, speakerAvatar: e.target.value })}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all outline-none"
                    />
                  </div>
                </div>
                <div className="space-y-1 mt-4">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Speaker Info/Bio</label>
                  <textarea
                    value={formData.speakerInfo}
                    onChange={(e) => setFormData({ ...formData, speakerInfo: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all outline-none h-20 resize-none"
                  />
                </div>
              </div>

              <div className="border-t border-gray-100 pt-4 mt-4">
                <h3 className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-4">Room Layout</h3>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Room Diagram URL</label>
                  <input
                    type="text"
                    value={formData.roomDiagramUrl}
                    onChange={(e) => setFormData({ ...formData, roomDiagramUrl: e.target.value })}
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
                  {loading ? 'Saving...' : (workshop ? 'Update Workshop' : 'Create Workshop')}
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-6 py-4">
              <div className="space-y-4">
            {workshop && (
              <div className="pt-6 border-t border-gray-100 space-y-4">
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">
                  AI Summary Content (PDF Upload)
                </label>
                <div className="group relative flex flex-col items-center justify-center p-6 border-2 border-dashed border-gray-200 rounded-2xl bg-gray-50 transition-all hover:border-indigo-300 hover:bg-indigo-50/30">
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
                    <p className="text-xs font-bold text-gray-600">{file ? file.name : 'Select PDF file to summarize'}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleUpload}
                  disabled={!file || uploading || isQueued}
                  className="w-full py-3 bg-indigo-50 text-indigo-600 font-bold rounded-xl border border-indigo-100 hover:bg-indigo-100 disabled:grayscale transition-all active:scale-95"
                >
                  {uploading ? 'Uploading PDF...' : isQueued ? 'In Queue (Processing...)' : 'Generate AI Summary'}
                </button>
                {uploadMessage && !isQueued && (
                  <p className={`text-xs text-center font-bold ${uploadMessage.includes('failed') ? 'text-rose-500' : 'text-emerald-500'}`}>
                    {uploadMessage}
                  </p>
                )}
                {isQueued && !aiSummary && (
                  <div className="p-6 bg-indigo-50/30 rounded-2xl border border-indigo-100 space-y-3 animate-pulse">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                      <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                    </div>
                    <div className="space-y-2">
                      <div className="h-2 bg-indigo-100 rounded-full w-full"></div>
                      <div className="h-2 bg-indigo-100 rounded-full w-5/6"></div>
                      <div className="h-2 bg-indigo-100 rounded-full w-4/6"></div>
                    </div>
                    <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest text-center pt-2">
                      Gemini is thinking...
                    </p>
                  </div>
                )}
                {aiSummary && (
                  <div className="p-6 bg-indigo-50 rounded-2xl border border-indigo-100 relative overflow-hidden animate-in zoom-in duration-500">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-200/20 rounded-full -mr-12 -mt-12 blur-2xl"></div>
                    <h4 className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-3 flex items-center">
                      <span className="w-4 h-[1px] bg-indigo-200 mr-2"></span>
                      AI Generated Insight
                    </h4>
                    <p className="text-sm text-gray-700 font-medium leading-relaxed italic relative z-10">
                      "{aiSummary}"
                    </p>
                  </div>
                )}
              </div>
            )}

              {aiSummary && (
                <div className="p-6 bg-indigo-50 rounded-2xl border border-indigo-100">
                  <h4 className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-3">AI Summary</h4>
                  <p className="text-sm text-gray-700 font-medium leading-relaxed italic">&ldquo;{aiSummary}&rdquo;</p>
                </div>
              )}
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
        </div>
      </div>
    </div>
  );
};

export default WorkshopFormModal;
