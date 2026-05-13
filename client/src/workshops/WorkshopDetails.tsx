import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useNotification } from '../context/NotificationContext';
import { QRCodeSVG } from 'qrcode.react';

interface Workshop {
  id: string;
  title: string;
  description: string | null;
  category: string | null;
  speakerName: string | null;
  room: string;
  startTime: string;
  endTime: string;
  registrationOpenAt: string | null;
  registrationCloseAt: string | null;
  capacity: number;
  availableSeats: number;
  price: number;
  aiSummary: string | null;
  status: string;
}

const decodeToken = (token: string) => {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    return JSON.parse(window.atob(base64));
  } catch (e) {
    return null;
  }
};

const WorkshopDetails = () => {
  const { id: workshopId } = useParams<{ id: string }>();
  const [workshop, setWorkshop] = useState<Workshop | null>(null);
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState(false);
  const { showNotification } = useNotification();

  const fetchWorkshop = async () => {
    try {
      const response = await fetch(`http://localhost:3000/workshops/${workshopId}`);
      if (response.ok) {
        const data = await response.json();
        setWorkshop(data);
      }
    } catch (error) {
      console.error('Failed to fetch workshop', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkshop();
    
    const interval = setInterval(() => {
      if (workshop && !workshop.aiSummary) {
        fetchWorkshop();
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [workshopId, workshop?.aiSummary]);

  const [showPaymentModal, setShowPaymentModal] = useState(false);

  // Poll for registration status when payment modal is open
  useEffect(() => {
    let interval: any;
    if (showPaymentModal && workshop) {
      interval = setInterval(async () => {
        try {
          const token = localStorage.getItem('token');
          const response = await fetch(`http://localhost:3000/registrations/${workshop.id}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          if (response.ok) {
            const registration = await response.json();
            if (registration && registration.status === 'CONFIRMED') {
              showNotification('Payment confirmed! Registration successful.', 'success');
              setShowPaymentModal(false);
              fetchWorkshop();
            }
          }
        } catch (e) {
          console.error('Polling for registration status failed', e);
        }
      }, 3000);
    }
    return () => clearInterval(interval);
  }, [showPaymentModal, workshop]);

  if (loading) return (
    <div className="max-w-5xl mx-auto mt-10 p-8 space-y-8 animate-pulse">
      <div className="h-64 bg-gray-200 rounded-3xl"></div>
      <div className="space-y-4">
        <div className="h-10 bg-gray-200 rounded-lg w-3/4"></div>
        <div className="h-6 bg-gray-100 rounded-lg w-1/4"></div>
      </div>
    </div>
  );

  if (!workshop) return (
    <div className="max-w-4xl mx-auto mt-10 p-12 bg-red-50 rounded-3xl border border-red-100 text-center">
      <div className="text-red-500 text-5xl mb-4">⚠️</div>
      <h2 className="text-2xl font-bold text-red-900 mb-2">Workshop not found</h2>
      <p className="text-red-600">The workshop you're looking for doesn't exist or has been removed.</p>
    </div>
  );

  const formatDateTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('vi-VN', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getRegistrationStatus = (): {
    canRegister: boolean;
    buttonText: string;
    buttonClass: string;
  } => {
    const now = new Date();
    const startTime = new Date(workshop.startTime);

    if (startTime < now) {
      return { canRegister: false, buttonText: 'Workshop Ended', buttonClass: 'bg-gray-400 cursor-not-allowed' };
    }
    if (workshop.registrationOpenAt && now < new Date(workshop.registrationOpenAt)) {
      return {
        canRegister: false,
        buttonText: `Opens ${new Date(workshop.registrationOpenAt).toLocaleDateString('vi-VN')}`,
        buttonClass: 'bg-amber-400 cursor-not-allowed',
      };
    }
    if (workshop.registrationCloseAt && now > new Date(workshop.registrationCloseAt)) {
      return { canRegister: false, buttonText: 'Registration Closed', buttonClass: 'bg-gray-400 cursor-not-allowed' };
    }
    if (workshop.availableSeats === 0) {
      return { canRegister: false, buttonText: 'Fully Booked', buttonClass: 'bg-gray-400 cursor-not-allowed' };
    }
    return { canRegister: true, buttonText: 'Register Now', buttonClass: 'bg-gray-900 hover:bg-black' };
  };

  const executeRegistration = async () => {
    if (!workshop) return;
    setRegistering(true);
    console.log('Starting registration for workshop:', workshop.id);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:3000/registrations/${workshop.id}`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      console.log('Response status:', response.status);
      if (response.ok) {
        const data = await response.json();
        console.log('Registration data:', data);
        if (data.status === 'PENDING') {
          console.log('Setting showPaymentModal to true');
          setShowPaymentModal(true);
        } else {
          showNotification('Registered successfully!', 'success');
          fetchWorkshop();
          setShowPaymentModal(false);
        }
      } else {
        const error = await response.json();
        showNotification(error.message || 'Registration failed', 'error');
      }
    } catch (error) {
      console.error('Registration failed', error);
      showNotification('Connection error during registration', 'error');
    } finally {
      setRegistering(false);
    }
  };

  const handleRegisterClick = () => {
    console.log('Register button clicked');
    if (!workshop) return;
    executeRegistration();
  };

  // Get User ID for QR code
  const token = localStorage.getItem('token');
  const userId = token ? decodeToken(token)?.sub : null;
  const qrValue = `http://192.168.1.169:3000/registrations/mock-payment/scan?workshopId=${workshop.id}&userId=${userId}`;

  return (
    <div className="max-w-5xl mx-auto mt-10 space-y-8 pb-20 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header Section */}
      <div className="bg-white rounded-[2.5rem] p-10 shadow-2xl shadow-indigo-100/50 border border-gray-50">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-10">
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <span className="px-4 py-1.5 bg-indigo-50 text-indigo-600 text-[10px] font-black uppercase tracking-[0.2em] rounded-full border border-indigo-100">
                {workshop.category || 'Workshop'}
              </span>
              <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] border
                ${workshop.status === 'PUBLISHED' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-amber-50 text-amber-600 border-amber-100'}`}>
                {workshop.status}
              </span>
            </div>
            <h1 className="text-5xl font-black text-gray-900 tracking-tight leading-tight">
              {workshop.title}
            </h1>
          </div>
          <div className="bg-gray-50 p-6 rounded-3xl border border-gray-100 text-center min-w-[200px]">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Price</p>
            <p className="text-3xl font-black text-indigo-600">
              {workshop.price === 0 ? 'FREE' : `${Number(workshop.price).toLocaleString()}đ`}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="flex items-center space-x-4 p-4 bg-gray-50/50 rounded-2xl border border-gray-100">
            <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm text-indigo-600">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">When</p>
              <p className="text-sm font-bold text-gray-900">{formatDateTime(workshop.startTime)}</p>
            </div>
          </div>

          <div className="flex items-center space-x-4 p-4 bg-gray-50/50 rounded-2xl border border-gray-100">
            <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm text-indigo-600">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <div>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Where</p>
              <p className="text-sm font-bold text-gray-900">{workshop.room}</p>
            </div>
          </div>

          <div className="flex items-center space-x-4 p-4 bg-gray-50/50 rounded-2xl border border-gray-100">
            <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm text-indigo-600">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <div>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Seats</p>
              <p className="text-sm font-bold text-gray-900">
                {workshop.availableSeats} / {workshop.capacity} available
              </p>
            </div>
          </div>
        </div>

        {/* Registration Window */}
        {(workshop.registrationOpenAt || workshop.registrationCloseAt) && (
          <div className="mt-6 p-4 bg-emerald-50 rounded-2xl border border-emerald-100 flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2 text-emerald-700">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span className="text-[10px] font-black uppercase tracking-widest">Registration Window</span>
            </div>
            <div className="flex items-center gap-2 text-sm font-bold text-gray-700">
              {workshop.registrationOpenAt && (
                <span className="px-3 py-1 bg-white rounded-lg border border-emerald-200">
                  Opens: {new Date(workshop.registrationOpenAt).toLocaleString('vi-VN')}
                </span>
              )}
              {workshop.registrationOpenAt && workshop.registrationCloseAt && <span className="text-emerald-400">→</span>}
              {workshop.registrationCloseAt && (
                <span className="px-3 py-1 bg-white rounded-lg border border-emerald-200">
                  Closes: {new Date(workshop.registrationCloseAt).toLocaleString('vi-VN')}
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Description & AI Summary */}
        <div className="lg:col-span-2 space-y-8">
          <section className="bg-white rounded-[2.5rem] p-10 shadow-xl border border-gray-50">
            <h2 className="text-2xl font-black text-gray-900 mb-6">About this Workshop</h2>
            <p className="text-gray-600 leading-relaxed text-lg">
              {workshop.description || "No description available for this workshop."}
            </p>
          </section>

          <section className="relative overflow-hidden p-10 rounded-[2.5rem] bg-indigo-600 text-white shadow-2xl shadow-indigo-200">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32 blur-3xl"></div>
            <h2 className="flex items-center text-[10px] font-black uppercase tracking-[0.3em] mb-8 text-indigo-100">
              <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              AI Content Insight
            </h2>
            
            {workshop.aiSummary ? (
              <p className="text-2xl font-medium leading-tight italic">
                "{workshop.aiSummary}"
              </p>
            ) : (
              <div className="flex items-center space-x-4 py-4">
                <div className="w-6 h-6 border-2 border-indigo-300 border-t-white rounded-full animate-spin"></div>
                <p className="font-bold text-indigo-100">Generating AI summary...</p>
              </div>
            )}
          </section>
        </div>

        {/* Right Column: Speaker & Room Diagram */}
        <div className="space-y-8">
          <section className="bg-white rounded-[2.5rem] p-8 shadow-xl border border-gray-50">
            <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest mb-6">Speaker</h3>
            <div className="flex items-center space-x-4 mb-6">
              <div className="w-16 h-16 bg-indigo-100 rounded-2xl flex items-center justify-center text-indigo-600 font-black text-2xl shadow-inner">
                {workshop.speakerName?.[0] || '?'}
              </div>
              <div>
                <p className="text-lg font-black text-gray-900">{workshop.speakerName || 'To be announced'}</p>
                <p className="text-xs font-bold text-indigo-500 uppercase tracking-widest">Keynote Speaker</p>
              </div>
            </div>
          </section>

          {(() => {
            const { canRegister, buttonText, buttonClass } = getRegistrationStatus();
            return (
              <button
                onClick={canRegister ? handleRegisterClick : undefined}
                disabled={!canRegister || registering}
                className={`w-full ${buttonClass} disabled:cursor-not-allowed text-white py-6 rounded-3xl font-black text-xl shadow-2xl shadow-gray-200 transition-all active:scale-[0.98] uppercase tracking-widest`}
              >
                {registering ? 'Processing...' : buttonText}
              </button>
            );
          })()}
        </div>
      </div>

      {/* Mock Payment Modal (QR Code) */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in slide-in-from-bottom-8 duration-500">
            <div className="p-8">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-black text-gray-900 tracking-tight">Payment QR</h2>
                <button onClick={() => setShowPaymentModal(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-400">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>

              <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-4 mb-6 flex justify-between items-center">
                <span className="text-sm font-bold text-indigo-900">Amount to Pay</span>
                <span className="text-xl font-black text-indigo-600">{Number(workshop.price).toLocaleString()}đ</span>
              </div>

              <div className="flex flex-col items-center justify-center space-y-6 py-4">
                <div className="p-6 bg-white border-4 border-indigo-600 rounded-3xl shadow-xl">
                  <QRCodeSVG value={qrValue} size={200} />
                </div>
                
                <div className="text-center space-y-2">
                  <p className="text-sm font-bold text-gray-600">Scan this QR with your phone to pay</p>
                  <p className="text-xs text-gray-400 italic">Waiting for scan confirmation...</p>
                </div>

                <div className="w-full flex items-center justify-center space-x-2 py-2">
                  <div className="w-2 h-2 bg-indigo-600 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-indigo-600 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                  <div className="w-2 h-2 bg-indigo-600 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                </div>

                {/* Secret simulation button for testing on the same machine */}
                <button
                  onClick={() => window.open(qrValue, '_blank')}
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

export default WorkshopDetails;
