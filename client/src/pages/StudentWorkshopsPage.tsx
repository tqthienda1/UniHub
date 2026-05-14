import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useNotification } from '../context/NotificationContext';
import { QRCodeSVG } from 'qrcode.react';

interface Workshop {
  id: string;
  title: string;
  room: string;
  startTime: string;
  capacity: number;
  availableSeats: number;
  price: number;
  category: string;
  speakerName?: string;
  registrationOpenAt?: string | null;
  registrationCloseAt?: string | null;
}

const PAGE_SIZE = 9;

const decodeToken = (token: string) => {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    return JSON.parse(window.atob(base64));
  } catch (e) {
    return null;
  }
};

const StudentWorkshopsPage = () => {
  const [workshops, setWorkshops] = useState<Workshop[]>([]);
  const [registrations, setRegistrations] = useState<any[]>([]); // New state
  const [myRegistrations, setMyRegistrations] = useState<string[]>([]);
  const [myPendingRegistrations, setMyPendingRegistrations] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [registeringId, setRegisteringId] = useState<string | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedWorkshopForPayment, setSelectedWorkshopForPayment] = useState<Workshop | null>(null);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [now, setNow] = useState(new Date());
  const { showNotification } = useNotification();

  const fetchData = async (signal?: AbortSignal) => {
    setLoading(true);

    // Workshops — abort-aware
    try {
      const workshopsRes = await fetch('http://localhost:3000/workshops?limit=200', { signal });
      if (signal?.aborted) return;
      if (workshopsRes.ok) {
        const data = await workshopsRes.json();
        if (!signal?.aborted) setWorkshops(data.items ?? []);
      }
    } catch (err: any) {
      if (err?.name === 'AbortError') return;
      console.error('Failed to fetch workshops', err);
      showNotification('Could not load workshop data', 'error');
    } finally {
      if (!signal?.aborted) setLoading(false);
    }

    // Registrations — independent fetch, same signal
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      const registrationsRes = await fetch('http://localhost:3000/registrations/me', {
        headers: { Authorization: `Bearer ${token}` },
        signal,
      });
      if (signal?.aborted) return;
      if (registrationsRes.ok) {
        const regs = await registrationsRes.json();
        if (signal?.aborted) return;
        setRegistrations(regs); // Save full objects
        const activeRegs = regs
          .filter((r: any) => r.status === 'CONFIRMED' || r.status === 'CHECKED_IN')
          .map((r: any) => r.workshopId);
        const pendingRegs = regs
          .filter((r: any) => r.status === 'PENDING')
          .map((r: any) => r.workshopId);
        setMyRegistrations(activeRegs);
        setMyPendingRegistrations(pendingRegs);
      }
    } catch (err: any) {
      if (err?.name === 'AbortError') return;
      console.error('Failed to fetch registrations', err);
    }
  };

  useEffect(() => {
    const controller = new AbortController();
    const timer = setTimeout(() => {
      void fetchData(controller.signal);
    }, 150);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, []);

  // Tick every second to update timers
  useEffect(() => {
    const ticker = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(ticker);
  }, []);

  const handleRegister = async (id: string) => {
    setRegisteringId(id);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:3000/registrations/${id}`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      if (response.ok) {
        const data = await response.json();
        if (data.status === 'PENDING') {
          const ws = workshops.find(w => w.id === id);
          if (ws) {
            setSelectedWorkshopForPayment(ws);
            setShowPaymentModal(true);
            void fetchData();
          }
        } else {
          showNotification('Registered successfully!', 'success');
          void fetchData();
        }
      } else {
        const error = await response.json();
        showNotification(error.message || 'Registration failed', 'error');
      }
    } catch (error) {
      console.error('Registration failed', error);
      showNotification('Connection error during registration', 'error');
    } finally {
      setRegisteringId(null);
    }
  };

  const handleRegisterClick = (workshop: Workshop) => {
    handleRegister(workshop.id);
  };

  // Poll for registration status when payment modal is open
  useEffect(() => {
    let interval: any;
    if (showPaymentModal && selectedWorkshopForPayment) {
      interval = setInterval(async () => {
        try {
          const token = localStorage.getItem('token');
          const response = await fetch(`http://localhost:3000/registrations/${selectedWorkshopForPayment.id}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          if (response.ok) {
            const registration = await response.json();
            if (registration && registration.status === 'CONFIRMED') {
              showNotification('Payment confirmed! Registration successful.', 'success');
              setShowPaymentModal(false);
              void fetchData();
            }
          }
        } catch (e) {
          console.error('Polling for registration status failed', e);
        }
      }, 3000);
    }
    return () => clearInterval(interval);
  }, [showPaymentModal, selectedWorkshopForPayment]);

  const getRegState = (workshop: Workshop): 'open' | 'not_open' | 'closed' | 'ended' => {
    const now = new Date();
    if (new Date(workshop.startTime) < now) return 'ended';
    if (workshop.registrationOpenAt && now < new Date(workshop.registrationOpenAt)) return 'not_open';
    if (workshop.registrationCloseAt && now > new Date(workshop.registrationCloseAt)) return 'closed';
    return 'open';
  };

  // Client-side search filter
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return workshops;
    return workshops.filter(
      (w) =>
        w.title.toLowerCase().includes(q) ||
        w.category?.toLowerCase().includes(q) ||
        w.room?.toLowerCase().includes(q) ||
        w.speakerName?.toLowerCase().includes(q),
    );
  }, [workshops, search]);

  // Reset page when search changes
  useEffect(() => {
    setPage(1);
  }, [search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // Get User ID for QR code
  const token = localStorage.getItem('token');
  const userId = token ? decodeToken(token)?.sub : null;

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black text-gray-900 tracking-tight sm:text-5xl">
            Available <span className="text-indigo-600">Workshops</span>
          </h1>
          <p className="text-gray-500 mt-2 text-lg">
            Browse and register for upcoming university workshops.
          </p>
        </div>
        <p className="text-sm font-bold text-gray-400 shrink-0">
          {filtered.length} workshop{filtered.length !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Search bar */}
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
          placeholder="Search by title, category, room, speaker…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-12 pr-4 py-3.5 bg-white border border-gray-200 rounded-2xl shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm font-medium text-gray-700 placeholder-gray-400 transition-all"
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

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-white rounded-3xl p-8 shadow-xl border border-gray-100 animate-pulse flex flex-col h-full">
              <div className="h-5 bg-gray-200 rounded w-1/3 mb-4" />
              <div className="h-7 bg-gray-100 rounded w-5/6 mb-2" />
              <div className="h-5 bg-gray-100 rounded w-2/3 mb-6" />
              <div className="space-y-2 mb-8 flex-1">
                <div className="h-4 bg-gray-50 rounded w-1/2" />
                <div className="h-4 bg-gray-50 rounded w-1/3" />
              </div>
              <div className="h-12 bg-indigo-50 rounded-2xl w-full" />
            </div>
          ))
        ) : paginated.length === 0 ? (
          <div className="col-span-full py-20 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-3xl flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                  d="M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0z" />
              </svg>
            </div>
            <p className="text-gray-400 font-bold text-lg">
              {search ? `No workshops match "${search}"` : 'No workshops available right now.'}
            </p>
          </div>
        ) : (
          paginated.map((workshop) => {
            const isRegistered = myRegistrations.includes(workshop.id);
            const isPending = myPendingRegistrations.includes(workshop.id);

            return (
              <div
                key={workshop.id}
                className="group bg-white rounded-3xl p-7 shadow-xl border border-gray-100 transition-all hover:shadow-2xl hover:-translate-y-1 flex flex-col"
              >
                {/* Top row: category + price */}
                <div className="flex justify-between items-start mb-4 gap-2">
                  <span className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full text-[10px] font-black uppercase tracking-widest shrink-0 max-w-[60%] truncate">
                    {workshop.category}
                  </span>
                  <span className={`font-black shrink-0 ${workshop.price === 0 ? 'text-emerald-500' : 'text-gray-900'}`}>
                    {workshop.price === 0 ? 'FREE' : `${Number(workshop.price).toLocaleString()}đ`}
                  </span>
                </div>

                {/* Title — fixed height, clamped to 2 lines */}
                <Link to={`/workshops/${workshop.id}`} className="block mb-4">
                  <h3 className="text-lg font-black text-gray-900 leading-snug line-clamp-2 group-hover:text-indigo-600 transition-colors min-h-[3rem]">
                    {workshop.title}
                  </h3>
                </Link>

                {/* Details — always the same area */}
                <div className="space-y-2 mb-4 flex-1">
                  <div className="flex items-center text-sm text-gray-500 font-semibold">
                    <svg className="w-4 h-4 mr-2 text-gray-300 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.828a2 2 0 01-2.828 0L6.343 16.657a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span className="truncate">{workshop.room}</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-500 font-semibold">
                    <svg className="w-4 h-4 mr-2 text-gray-300 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="truncate">{new Date(workshop.startTime).toLocaleString('vi-VN')}</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-500 font-semibold">
                    <svg className="w-4 h-4 mr-2 text-gray-300 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    <span className="truncate">{workshop.speakerName || 'To be announced'}</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-500 font-semibold">
                    <svg className="w-4 h-4 mr-2 text-gray-300 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                    {workshop.availableSeats} / {workshop.capacity} seats left
                  </div>
                </div>

                {/* Registration window badge */}
                {(workshop.registrationOpenAt || workshop.registrationCloseAt) && (
                  <div className="mb-3 flex items-center gap-1.5 text-[10px] font-bold text-emerald-600 uppercase tracking-wider">
                    <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span className="truncate">
                      {workshop.registrationOpenAt && workshop.registrationCloseAt
                        ? `Reg: ${new Date(workshop.registrationOpenAt).toLocaleDateString('vi-VN')} → ${new Date(workshop.registrationCloseAt).toLocaleDateString('vi-VN')}`
                        : workshop.registrationCloseAt
                        ? `Closes: ${new Date(workshop.registrationCloseAt).toLocaleDateString('vi-VN')}`
                        : `Opens: ${new Date(workshop.registrationOpenAt!).toLocaleDateString('vi-VN')}`}
                    </span>
                  </div>
                )}

                {/* CTA Button */}
                {(() => {
                  const regState = getRegState(workshop);
                  const isProcessing = registeringId === workshop.id;
                  let disabled = false;
                  let label = 'Register Now';
                  let cls = 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-100';

                  if (isRegistered) {
                    disabled = true; label = '✓ Registered';
                    cls = 'bg-emerald-50 text-emerald-600 border border-emerald-100 shadow-none cursor-default';
                  } else if (isPending) {
                    const reg = registrations.find((r: any) => r.workshopId === workshop.id);
                    let timeStr = '';
                    if (reg) {
                      const expiresAt = new Date(new Date(reg.createdAt).getTime() + 15 * 60 * 1000);
                      const diff = expiresAt.getTime() - now.getTime();
                      const mins = Math.max(0, Math.floor(diff / 60000));
                      const secs = Math.max(0, Math.floor((diff % 60000) / 1000));
                      timeStr = ` — ${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')} left`;
                    }
                    label = `⏳ Payment Pending${timeStr}`;
                    cls = 'bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100 shadow-amber-100';
                  } else if (isProcessing) {
                    disabled = true; label = 'Processing...';
                  } else if (regState === 'ended') {
                    disabled = true; label = 'Workshop Ended';
                    cls = 'bg-gray-100 text-gray-400 cursor-not-allowed shadow-none';
                  } else if (regState === 'not_open') {
                    disabled = true;
                    label = `Opens ${new Date(workshop.registrationOpenAt!).toLocaleDateString('vi-VN')}`;
                    cls = 'bg-amber-100 text-amber-600 cursor-not-allowed shadow-none';
                  } else if (regState === 'closed') {
                    disabled = true; label = 'Registration Closed';
                    cls = 'bg-gray-100 text-gray-400 cursor-not-allowed shadow-none';
                  } else if (workshop.availableSeats === 0) {
                    disabled = true; label = 'Fully Booked';
                    cls = 'bg-gray-100 text-gray-400 cursor-not-allowed shadow-none';
                  }

                  return (
                    <button
                      onClick={() => !disabled && handleRegisterClick(workshop)}
                      disabled={disabled}
                      className={`mt-auto w-full py-4 rounded-2xl font-bold transition-all active:scale-95 shadow-lg ${cls}`}
                    >
                      {label}
                    </button>
                  );
                })()}
              </div>
            );
          })
        )}
      </div>

      {/* Pagination */}
      {!loading && totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-4">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="p-2.5 rounded-xl border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          {Array.from({ length: totalPages }, (_, i) => i + 1)
            .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
            .reduce<(number | '...')[]>((acc, p, idx, arr) => {
              if (idx > 0 && p - (arr[idx - 1] as number) > 1) acc.push('...');
              acc.push(p);
              return acc;
            }, [])
            .map((p, i) =>
              p === '...' ? (
                <span key={`ellipsis-${i}`} className="px-2 text-gray-400 font-bold">…</span>
              ) : (
                <button
                  key={p}
                  onClick={() => setPage(p as number)}
                  className={`w-10 h-10 rounded-xl font-black text-sm transition-all ${
                    page === p
                      ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200'
                      : 'border border-gray-200 text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {p}
                </button>
              ),
            )}

          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="p-2.5 rounded-xl border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      )}

      {!loading && filtered.length > 0 && (
        <p className="text-center text-xs text-gray-400 font-bold -mt-2">
          Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length}
        </p>
      )}

      {/* Mock Payment Modal (QR Code) */}
      {showPaymentModal && selectedWorkshopForPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-md max-h-[90vh] overflow-y-auto rounded-[2rem] shadow-2xl animate-in zoom-in slide-in-from-bottom-8 duration-500 scrollbar-hide">
            <div className="p-8">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-black text-gray-900 tracking-tight">Payment QR</h2>
                <button onClick={() => setShowPaymentModal(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-400">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>

              <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-4 mb-6 flex justify-between items-center">
                <span className="text-sm font-bold text-indigo-900">Workshop Fee</span>
                <span className="text-xl font-black text-indigo-600">{Number(selectedWorkshopForPayment.price).toLocaleString()}đ</span>
              </div>

              <div className="flex flex-col items-center justify-center space-y-6 py-4">
                <div className="p-6 bg-white border-4 border-indigo-600 rounded-3xl shadow-xl">
                  <QRCodeSVG 
                    value={`http://192.168.1.169:3000/registrations/mock-payment/scan?workshopId=${selectedWorkshopForPayment.id}&userId=${userId}`} 
                    size={200} 
                  />
                </div>
                
                <div className="text-center space-y-2">
                  <div className="flex items-center justify-center space-x-2 text-rose-500 font-black text-lg">
                    <svg className="w-5 h-5 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>Seat expires in: {(() => {
                      const reg = registrations.find((r: any) => r.workshopId === selectedWorkshopForPayment.id);
                      if (!reg) return '15:00';
                      const expiresAt = new Date(new Date(reg.createdAt).getTime() + 15 * 60 * 1000);
                      const diff = expiresAt.getTime() - now.getTime();
                      const mins = Math.max(0, Math.floor(diff / 60000));
                      const secs = Math.max(0, Math.floor((diff % 60000) / 1000));
                      return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
                    })()}</span>
                  </div>
                  <p className="text-sm font-bold text-gray-600 italic">Scan QR to complete registration</p>
                </div>

                <div className="w-full flex items-center justify-center space-x-2 py-2">
                  <div className="w-2 h-2 bg-indigo-600 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-indigo-600 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                  <div className="w-2 h-2 bg-indigo-600 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                </div>

                <button
                  onClick={() => window.open(`http://192.168.1.169:3000/registrations/mock-payment/scan?workshopId=${selectedWorkshopForPayment.id}&userId=${userId}`, '_blank')}
                  className="text-[10px] text-gray-300 hover:text-indigo-400 transition-colors uppercase tracking-tighter"
                >
                  (Mock Scan on Web)
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentWorkshopsPage;
