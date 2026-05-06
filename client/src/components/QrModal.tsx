import { QRCodeSVG } from 'qrcode.react';

interface QrModalProps {
  isOpen: boolean;
  onClose: () => void;
  token: string | null;
  workshopTitle: string;
}

const QrModal = ({ isOpen, onClose, token, workshopTitle }: QrModalProps) => {
  if (!isOpen || !token) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full p-8 text-center animate-in zoom-in duration-300">
        <div className="flex justify-center mb-6">
          <div className="p-3 bg-indigo-100 rounded-2xl">
            <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v1m0 11v1m5-11v1m0 11v1M7 4v1m0 11v1m12-7h-1m-11 0H6m11 0h-1m-11 0H6m12 0h-1M6 12h1m11 0h1M6 12h1m11 0h1" />
            </svg>
          </div>
        </div>
        <h3 className="text-2xl font-black text-gray-900 mb-2">{workshopTitle}</h3>
        <p className="text-gray-500 text-sm mb-8 font-medium italic">Official Check-in Pass</p>
        
        <div className="bg-white p-4 rounded-3xl inline-block border-4 border-gray-900 shadow-2xl mb-8">
          <QRCodeSVG value={token} size={200} level="H" includeMargin={false} />
        </div>

        <button
          onClick={onClose}
          className="w-full py-4 bg-gray-900 text-white rounded-2xl font-black hover:bg-gray-800 transition-all active:scale-95 shadow-xl shadow-gray-200"
        >
          Done
        </button>
      </div>
    </div>
  );
};

export default QrModal;
