import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useNotification } from '../context/NotificationContext';
import ConfirmModal from '../components/ConfirmModal';
import QrModal from '../components/QrModal';

interface Registration {
  id: string;
  workshopId: string;
  status: string;
  qrToken: string | null;
  createdAt: string;
  workshop: {
    title: string;
    room: string;
    startTime: string;
    aiSummary?: string | null;
  };
}

const MyRegistrationsPage = () => {
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [isSummaryModalOpen, setIsSummaryModalOpen] = useState(false);
  const [selectedReg, setSelectedReg] = useState<Registration | null>(null);
  const [search, setSearch] = useState('');
  const { showNotification } = useNotification();

  const fetchRegistrations = async (signal?: AbortSignal) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3000/registrations/me', {
        headers: { Authorization: `Bearer ${token}` },
        signal,
      });
      if (signal?.aborted) return;
      if (response.ok) {
        const data = await response.json();
        if (!signal?.aborted) setRegistrations(data);
      }
    } catch (err: any) {
      if (err?.name === 'AbortError') return;
      console.error('Failed to fetch registrations', err);
      showNotification('Could not load registrations', 'error');
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  };

  useEffect(() => {
    const controller = new AbortController();
    const timer = setTimeout(() => {
      void fetchRegistrations(controller.signal);
    }, 150);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, []);

  const initiateCancel = (reg: Registration) => {
    setSelectedReg(reg);
    setIsCancelModalOpen(true);
  };

  const showQr = (reg: Registration) => {
    setSelectedReg(reg);
    setIsQrModalOpen(true);
  };

  const showSummary = (reg: Registration) => {
    setSelectedReg(reg);
    setIsSummaryModalOpen(true);
  };

  const handleCancel = async () => {
    if (!selectedReg) return;
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `http://localhost:3000/registrations/${selectedReg.id}/cancel`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        },
      );
      if (response.ok) {
        showNotification('Registration cancelled successfully', 'success');
        void fetchRegistrations();
      } else {
        const error = await response.json();
        showNotification(error.message || 'Cancellation failed', 'error');
      }
    } catch (error) {
      console.error('Cancellation failed', error);
      showNotification('Connection error during cancellation', 'error');
    } finally {
      setIsCancelModalOpen(false);
      setSelectedReg(null);
    }
  };

  // Filter: exclude cancelled, then apply search
  const activeRegistrations = useMemo(() => {
    const active = registrations.filter((r) => r.status !== 'CANCELLED');
    const q = search.trim().toLowerCase();
    if (!q) return active;
    return active.filter(
      (r) =>
        r.workshop.title.toLowerCase().includes(q) ||
        r.workshop.room.toLowerCase().includes(q) ||
        r.status.toLowerCase().includes(q),
    );
  }, [registrations, search]);

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black text-gray-900 tracking-tight sm:text-5xl">
            My <span className="text-indigo-600">Registrations</span>
          </h1>
          <p className="text-gray-500 mt-2 text-lg font-medium">
            Manage your active workshops and access your check-in passes.
          </p>
        </div>
        {!loading && (
          <p className="text-sm font-bold text-gray-400 shrink-0">
            {activeRegistrations.length} registration{activeRegistrations.length !== 1 ? 's' : ''}
          </p>
        )}
      </div>

      {/* Search */}
      {!loading && registrations.filter((r) => r.status !== 'CANCELLED').length > 0 && (
        <div className="relative">
          <svg
            className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-300"
            fill="none" stroke="currentColor" viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
              d="M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search by workshop title, room, or status…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-12 pr-10 py-3.5 bg-white border border-gray-200 rounded-2xl shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm font-medium text-gray-700 placeholder-gray-400 transition-all"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      )}

      {/* Table card */}
      <div className="bg-white rounded-[2.5rem] shadow-2xl shadow-indigo-100/50 border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="p-20 text-center">
            <div className="inline-block w-8 h-8 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin mb-4" />
            <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">
              Syncing your records...
            </p>
          </div>
        ) : activeRegistrations.length === 0 ? (
          <div className="p-24 text-center">
            <div className="w-20 h-20 bg-gray-50 rounded-3xl flex items-center justify-center mx-auto mb-8">
              <svg className="w-10 h-10 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                  d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <p className="text-gray-400 font-black text-xl mb-8 uppercase tracking-tight">
              {search ? `No registrations match "${search}"` : 'No active registrations found'}
            </p>
            {!search && (
              <Link
                to="/"
                className="inline-flex items-center px-10 py-5 bg-indigo-600 text-white rounded-2xl font-black hover:bg-indigo-700 transition-all active:scale-95 shadow-xl shadow-indigo-200"
              >
                Find Workshops
                <svg className="ml-2 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </Link>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/50">
                  <th className="px-10 py-6 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] border-b border-gray-100">Workshop</th>
                  <th className="px-10 py-6 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] border-b border-gray-100">Schedule</th>
                  <th className="px-10 py-6 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] border-b border-gray-100">Status</th>
                  <th className="px-10 py-6 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] border-b border-gray-100">Summary</th>
                  <th className="px-10 py-6 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] border-b border-gray-100 text-right">Pass</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {activeRegistrations.map((reg) => (
                  <tr key={reg.id} className="group hover:bg-indigo-50/30 transition-all duration-300">
                    <td className="px-10 py-8">
                      <div className="font-black text-gray-900 text-base mb-1 group-hover:text-indigo-600 transition-colors leading-snug">
                        {reg.workshop.title}
                      </div>
                      <div className="flex items-center text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                        <svg className="w-3 h-3 mr-1 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        {reg.workshop.room}
                      </div>
                    </td>
                    <td className="px-10 py-8">
                      <div className="text-sm text-gray-700 font-black tracking-tight">
                        {new Date(reg.workshop.startTime).toLocaleDateString('vi-VN')}
                      </div>
                      <div className="text-xs text-gray-400 font-bold">
                        {new Date(reg.workshop.startTime).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </td>
                    <td className="px-10 py-8">
                      <span className={`inline-flex items-center px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-[0.15em] shadow-sm
                        ${reg.status === 'CONFIRMED' ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' :
                          reg.status === 'CHECKED_IN' ? 'bg-indigo-100 text-indigo-700 border border-indigo-200' :
                          'bg-gray-100 text-gray-500'}`}>
                        <span className={`w-1.5 h-1.5 rounded-full mr-2 ${reg.status === 'CONFIRMED' ? 'bg-emerald-500' : reg.status === 'CHECKED_IN' ? 'bg-indigo-500' : 'bg-gray-400'}`} />
                        {reg.status}
                      </span>
                    </td>
                    <td className="px-10 py-8">
                      {reg.workshop.aiSummary ? (
                        <button
                          onClick={() => showSummary(reg)}
                          className="px-4 py-2 bg-indigo-50 text-indigo-600 text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-indigo-100 transition-all active:scale-95 border border-indigo-100"
                        >
                          View Intro
                        </button>
                      ) : (
                        <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest">N/A</span>
                      )}
                    </td>
                    <td className="px-10 py-8 text-right">
                      <div className="flex items-center justify-end space-x-4">
                        {reg.status === 'CONFIRMED' && (
                          <>
                            <button
                              onClick={() => showQr(reg)}
                              className="px-4 py-2 bg-gray-900 text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-gray-800 transition-all active:scale-95 shadow-lg shadow-gray-200"
                            >
                              View QR
                            </button>
                            {new Date(reg.workshop.startTime) > new Date() && (
                              <button
                                onClick={() => initiateCancel(reg)}
                                className="text-[10px] font-black text-rose-500 hover:text-rose-600 uppercase tracking-[0.2em] transition-colors"
                              >
                                Cancel
                              </button>
                            )}
                          </>
                        )}
                        {reg.status === 'CHECKED_IN' && (
                          <div className="text-[10px] font-black text-emerald-500 uppercase tracking-widest flex items-center">
                            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                            </svg>
                            Attended
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <ConfirmModal
        isOpen={isCancelModalOpen}
        title="Cancel Registration"
        message={`Are you sure you want to cancel your seat for "${selectedReg?.workshop.title}"? This cannot be undone.`}
        onConfirm={handleCancel}
        onCancel={() => setIsCancelModalOpen(false)}
        confirmText="Yes, Release Seat"
        isDestructive={true}
      />

      <QrModal
        isOpen={isQrModalOpen}
        onClose={() => setIsQrModalOpen(false)}
        token={selectedReg?.qrToken || null}
        workshopTitle={selectedReg?.workshop.title || ''}
      />

      {isSummaryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in slide-in-from-bottom-8 duration-500">
            <div className="p-10 space-y-8">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-2xl font-black text-gray-900 tracking-tight leading-tight mb-2">Workshop Intro</h3>
                  <p className="text-indigo-600 font-bold text-sm uppercase tracking-widest">{selectedReg?.workshop.title}</p>
                </div>
                <button
                  onClick={() => setIsSummaryModalOpen(false)}
                  className="p-2 hover:bg-gray-100 rounded-2xl transition-colors"
                >
                  <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="p-8 rounded-[2rem] bg-indigo-50/50 border border-indigo-100 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-400/5 rounded-full -mr-12 -mt-12 blur-xl" />
                <h4 className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.3em] mb-4 flex items-center">
                  <span className="w-6 h-[2px] bg-indigo-200 mr-2" />
                  AI Generated Summary
                </h4>
                <p className="text-gray-700 text-base font-medium leading-relaxed italic">
                  "{selectedReg?.workshop.aiSummary}"
                </p>
              </div>
              <button
                onClick={() => setIsSummaryModalOpen(false)}
                className="w-full py-5 bg-gray-900 text-white font-black rounded-2xl shadow-xl shadow-gray-200 hover:bg-gray-800 transition-all active:scale-95 uppercase tracking-widest text-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyRegistrationsPage;
