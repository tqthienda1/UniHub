import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';

const CheckInPage = () => {
  const { id: workshopId } = useParams<{ id: string }>();
  const [qrToken, setQrToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [workshop, setWorkshop] = useState<any>(null);

  useEffect(() => {
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
    if (workshopId) fetchWorkshop();
  }, [workshopId]);

  const handleCheckIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!qrToken) return;

    setLoading(true);
    setMessage(null);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:3000/admin/workshops/${workshopId}/checkin`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ qrToken }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage({ type: 'success', text: `Successfully checked in: ${data.registration.user.fullName}` });
        setQrToken('');
      } else {
        setMessage({ type: 'error', text: data.message || 'Check-in failed' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'An error occurred during check-in' });
    } finally {
      setLoading(false);
    }
  };

  if (!workshopId) {
    return (
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-black text-gray-900 tracking-tight">Check-in Terminal</h1>
          <p className="text-gray-500 mt-2">Select a workshop to start checking in students.</p>
        </div>
        {/* We can reuse parts of AdminWorkshopsPage or just link back to it if it's handled in Dashboard */}
        <div className="flex justify-center">
            <Link to="/" className="text-indigo-600 font-bold hover:underline">Back to Workshop List</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex items-center space-x-4">
        <Link to="/" className="p-2 hover:bg-gray-100 rounded-full transition-colors">
          <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">Check-in Session</h1>
          {workshop && (
            <p className="text-gray-500 mt-1 font-medium">
              {workshop.title} • <span className="text-indigo-600">{workshop.room}</span>
            </p>
          )}
        </div>
      </div>

      <div className="bg-white rounded-[2rem] shadow-2xl shadow-indigo-100/50 border border-gray-100 p-8 md:p-12 overflow-hidden relative">
        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-full -mr-16 -mt-16 opacity-50 blur-3xl"></div>
        
        <form onSubmit={handleCheckIn} className="relative z-10 space-y-8">
          <div className="space-y-4">
            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">
              Scan QR Token
            </label>
            <div className="relative group">
              <input
                autoFocus
                type="text"
                value={qrToken}
                onChange={(e) => setQrToken(e.target.value)}
                placeholder="Paste or scan token here..."
                className="w-full px-6 py-5 bg-gray-50 border-2 border-transparent focus:border-indigo-500 focus:bg-white rounded-2xl text-lg font-bold text-gray-900 transition-all outline-none"
              />
              <div className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-indigo-100 text-indigo-600 rounded-lg group-focus-within:bg-indigo-600 group-focus-within:text-white transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v1m0 11v1m4-8h1m-11 0h1m12 10a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || !qrToken}
            className="w-full py-5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-2xl font-black text-lg shadow-xl shadow-indigo-100 transition-all active:scale-[0.98] flex items-center justify-center space-x-3"
          >
            {loading ? (
              <div className="w-6 h-6 border-3 border-white/30 border-t-white rounded-full animate-spin"></div>
            ) : (
              <>
                <span>Process Check-in</span>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                </svg>
              </>
            )}
          </button>
        </form>

        {message && (
          <div className={`mt-8 p-6 rounded-2xl border-2 animate-in zoom-in duration-300 ${
            message.type === 'success' 
              ? 'bg-emerald-50 border-emerald-100 text-emerald-700' 
              : 'bg-rose-50 border-rose-100 text-rose-700'
          }`}>
            <div className="flex items-start space-x-4">
              <div className={`p-2 rounded-xl ${
                message.type === 'success' ? 'bg-emerald-200/50' : 'bg-rose-200/50'
              }`}>
                {message.type === 'success' ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                )}
              </div>
              <div>
                <p className="font-bold text-lg leading-tight">{message.type === 'success' ? 'Verified!' : 'Failed'}</p>
                <p className="text-sm font-medium mt-1 opacity-80">{message.text}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="bg-amber-50 rounded-2xl p-6 border border-amber-100 flex items-start space-x-4">
        <div className="p-2 bg-amber-100 text-amber-600 rounded-lg">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <div>
          <p className="text-amber-900 font-bold text-sm">Operator Instruction</p>
          <p className="text-amber-700 text-xs mt-1 leading-relaxed">
            Please ensure the student's QR code is clearly visible. If the token is manually entered, double-check all characters before submitting.
          </p>
        </div>
      </div>
    </div>
  );
};

export default CheckInPage;
