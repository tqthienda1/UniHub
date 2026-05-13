import React, { useState, useEffect } from 'react';

interface Workshop {
  id: string;
  title: string;
  description?: string;
  room: string;
  startTime: string;
  endTime: string;
  registrationOpenAt?: string | null;
  registrationCloseAt?: string | null;
  capacity: number;
  price: number;
  category: string;
  speakerName?: string;
  aiSummary?: string | null;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  workshop?: Workshop | null;
}

const toLocalDatetime = (iso: string | null | undefined): string => {
  if (!iso) return '';
  // Convert ISO string to local datetime-local format (yyyy-MM-ddTHH:mm)
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

const WorkshopFormModal: React.FC<Props> = ({ isOpen, onClose, onSuccess, workshop }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    room: '',
    startTime: '',
    endTime: '',
    registrationOpenAt: '',
    registrationCloseAt: '',
    capacity: 0,
    price: 0,
    category: '',
    speakerName: '',
  });
  const [validationError, setValidationError] = useState<string | null>(null);
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
        startTime: toLocalDatetime(workshop.startTime),
        endTime: toLocalDatetime(workshop.endTime),
        registrationOpenAt: toLocalDatetime(workshop.registrationOpenAt),
        registrationCloseAt: toLocalDatetime(workshop.registrationCloseAt),
        capacity: workshop.capacity,
        price: workshop.price,
        category: workshop.category,
        speakerName: workshop.speakerName || '',
      });
      setAiSummary(workshop.aiSummary || null);
    } else {
      setFormData({
        title: '',
        description: '',
        room: '',
        startTime: '',
        endTime: '',
        registrationOpenAt: '',
        registrationCloseAt: '',
        capacity: 0,
        price: 0,
        category: '',
        speakerName: '',
      });
      setAiSummary(null);
    }
    setFile(null);
    setUploadMessage('');
    setIsQueued(false);
    setValidationError(null);
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
              onSuccess();
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

  const validateDates = (): string | null => {
    const start = formData.startTime ? new Date(formData.startTime) : null;
    const end = formData.endTime ? new Date(formData.endTime) : null;
    const regOpen = formData.registrationOpenAt ? new Date(formData.registrationOpenAt) : null;
    const regClose = formData.registrationCloseAt ? new Date(formData.registrationCloseAt) : null;
    const now = new Date();

    if (start && end && end <= start) {
      return 'Workshop end time must be after start time.';
    }
    if ((regOpen && !regClose) || (!regOpen && regClose)) {
      return 'Both registration open and close dates must be provided together.';
    }
    if (regOpen && regClose) {
      if (regClose <= regOpen) {
        return 'Registration close date must be after the open date.';
      }
      if (start && regClose > start) {
        return 'Registration must close before or when the workshop starts.';
      }
      if (!workshop && regOpen <= now) {
        return 'Registration open date must be in the future.';
      }
    }
    return null;
  };

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
        headers: { Authorization: `Bearer ${token}` },
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
    setValidationError(null);

    const err = validateDates();
    if (err) {
      setValidationError(err);
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const url = workshop
        ? `http://localhost:3000/staff-portal/workshops/${workshop.id}`
        : 'http://localhost:3000/staff-portal/workshops';
      const method = workshop ? 'PATCH' : 'POST';

      const body: Record<string, unknown> = {
        ...formData,
        capacity: Number(formData.capacity),
        price: Number(formData.price),
        startTime: new Date(formData.startTime).toISOString(),
        endTime: formData.endTime ? new Date(formData.endTime).toISOString() : undefined,
        registrationOpenAt: formData.registrationOpenAt
          ? new Date(formData.registrationOpenAt).toISOString()
          : null,
        registrationCloseAt: formData.registrationCloseAt
          ? new Date(formData.registrationCloseAt).toISOString()
          : null,
      };

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      if (response.ok) {
        const savedWorkshop = await response.json();
        
        // If creating a new workshop and a file is selected, upload it automatically
        if (!workshop && file && savedWorkshop.id) {
          const uploadFormData = new FormData();
          uploadFormData.append('file', file);
          try {
            await fetch(`http://localhost:3000/staff-portal/workshops/${savedWorkshop.id}/pdf`, {
              method: 'POST',
              headers: { Authorization: `Bearer ${token}` },
              body: uploadFormData,
            });
          } catch (uploadError) {
            console.error('Failed to upload PDF automatically', uploadError);
          }
        }

        onSuccess();
        onClose();
      } else {
        const errData = await response.json();
        setValidationError(errData.message || 'Failed to save workshop.');
      }
    } catch (error) {
      console.error('Failed to save workshop', error);
      setValidationError('Connection error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in slide-in-from-bottom-8 duration-500">
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

          {validationError && (
            <div 
              ref={(el) => {
                if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
              }}
              className="flex items-start gap-3 p-4 bg-rose-50 border border-rose-200 rounded-2xl"
            >
              <svg className="w-5 h-5 text-rose-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
              </svg>
              <p className="text-sm font-bold text-rose-700">{validationError}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Title & Category */}
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

            {/* Description */}
            <div className="space-y-1">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all outline-none h-24 resize-none"
              />
            </div>

            {/* Room */}
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

            {/* Workshop Dates Section */}
            <div className="border border-indigo-100 rounded-2xl p-5 space-y-4 bg-indigo-50/30">
              <h3 className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">
                📅 Workshop Schedule
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Start Time <span className="text-rose-400">*</span></label>
                  <input
                    required
                    type="datetime-local"
                    value={formData.startTime}
                    onChange={(e) => { setFormData({ ...formData, startTime: e.target.value }); setValidationError(null); }}
                    className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 transition-all outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">End Time</label>
                  <input
                    type="datetime-local"
                    value={formData.endTime}
                    onChange={(e) => { setFormData({ ...formData, endTime: e.target.value }); setValidationError(null); }}
                    className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 transition-all outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Registration Window Section */}
            <div className="border border-emerald-100 rounded-2xl p-5 space-y-4 bg-emerald-50/30">
              <div>
                <h3 className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">
                  🎟️ Registration Window
                </h3>
                <p className="text-[10px] text-gray-400 mt-1">Leave blank if registration is always open (until the workshop starts).</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Registration Opens</label>
                  <input
                    type="datetime-local"
                    value={formData.registrationOpenAt}
                    onChange={(e) => { setFormData({ ...formData, registrationOpenAt: e.target.value }); setValidationError(null); }}
                    className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 transition-all outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Registration Closes</label>
                  <input
                    type="datetime-local"
                    value={formData.registrationCloseAt}
                    onChange={(e) => { setFormData({ ...formData, registrationCloseAt: e.target.value }); setValidationError(null); }}
                    className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 transition-all outline-none"
                  />
                </div>
              </div>
              {/* Visual timeline hint */}
              {formData.registrationOpenAt && formData.registrationCloseAt && formData.startTime && (
                <div className="flex items-center gap-2 text-[10px] font-bold text-gray-400">
                  <span className="px-2 py-1 bg-emerald-100 text-emerald-700 rounded-lg">Reg Opens</span>
                  <span>→</span>
                  <span className="px-2 py-1 bg-emerald-100 text-emerald-700 rounded-lg">Reg Closes</span>
                  <span>→</span>
                  <span className="px-2 py-1 bg-indigo-100 text-indigo-700 rounded-lg">Workshop Starts</span>
                </div>
              )}
            </div>

            {/* Capacity & Price */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Capacity</label>
                <input
                  required
                  type="number"
                  min="1"
                  value={formData.capacity}
                  onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) || 0 })}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all outline-none"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Price (đ)</label>
                <input
                  required
                  type="number"
                  min="0"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: parseInt(e.target.value) || 0 })}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all outline-none"
                />
              </div>
            </div>

            {/* Speaker */}
            <div className="border-t border-gray-100 pt-4">
              <h3 className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-4">Speaker Information</h3>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Speaker Name</label>
                <input
                  type="text"
                  value={formData.speakerName}
                  onChange={(e) => setFormData({ ...formData, speakerName: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all outline-none"
                />
              </div>
            </div>

            {/* AI Summary */}
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
              
              {workshop ? (
                <button
                  type="button"
                  onClick={handleUpload}
                  disabled={!file || uploading || isQueued}
                  className="w-full py-3 bg-indigo-50 text-indigo-600 font-bold rounded-xl border border-indigo-100 hover:bg-indigo-100 disabled:grayscale transition-all active:scale-95"
                >
                  {uploading ? 'Uploading PDF...' : isQueued ? 'In Queue (Processing...)' : 'Generate AI Summary'}
                </button>
              ) : (
                <div className="w-full py-3 bg-indigo-50/50 text-indigo-400 text-sm font-bold rounded-xl border border-indigo-100/50 text-center">
                  {file ? 'PDF will be summarized automatically after you click Create.' : 'Select a PDF to summarize after creation.'}
                </div>
              )}

              {uploadMessage && !isQueued && workshop && (
                <p className={`text-xs text-center font-bold ${uploadMessage.includes('failed') ? 'text-rose-500' : 'text-emerald-500'}`}>
                  {uploadMessage}
                </p>
              )}
              {isQueued && !aiSummary && workshop && (
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
              {aiSummary && workshop && (
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
        </div>
      </div>
    </div>
  );
};

export default WorkshopFormModal;
