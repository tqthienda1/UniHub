import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import WorkshopFormModal from '../components/WorkshopFormModal';




interface Workshop {
  id: string;
  title: string;
  room: string;
  startTime: string;
  capacity: number;
  availableSeats: number;
  price: number;
  status: 'DRAFT' | 'PUBLISHED' | 'CANCELLED';
  category: string;
  aiSummary?: string | null;
}

const AdminWorkshopsPage = () => {
  const { user } = useAuth();
  const [workshops, setWorkshops] = useState<Workshop[]>([]);
  
  const isStaff = user?.role === 'CHECKIN_STAFF';

  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingWorkshop, setEditingWorkshop] = useState<Workshop | null>(null);

  const fetchWorkshops = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3000/admin/workshops', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setWorkshops(data.items);
      }
    } catch (error) {
      console.error('Failed to fetch workshops', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkshops();
  }, []);

  const handlePublish = async (id: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:3000/admin/workshops/${id}/publish`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (response.ok) {
        fetchWorkshops();
      }
    } catch (error) {
      console.error('Failed to publish', error);
    }
  };

  const handleCancel = async (id: string) => {
    if (!confirm('Are you sure you want to cancel this workshop?')) return;
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:3000/admin/workshops/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (response.ok) {
        fetchWorkshops();
      }
    } catch (error) {
      console.error('Failed to cancel', error);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">Workshop Management</h1>
          <p className="text-gray-500 mt-1">{isStaff ? 'Check in students for upcoming workshops.' : 'Create and manage your workshop sessions.'}</p>
        </div>
        {!isStaff && (
          <button
            onClick={() => {
              setEditingWorkshop(null);
              setIsModalOpen(true);
            }}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-indigo-100 transition-all active:scale-95"
          >
            Create Workshop
          </button>
        )}
      </div>

      <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-widest">Workshop</th>
              <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-widest">Status</th>
              <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-widest">Capacity</th>
              <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-widest">Price</th>
              <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-widest text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {loading ? (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center">
                  <div className="flex flex-col items-center">
                    <div className="w-8 h-8 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin"></div>
                    <p className="mt-4 text-gray-400 font-medium">Loading workshops...</p>
                  </div>
                </td>
              </tr>
            ) : workshops.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-gray-400 font-medium">
                  No workshops found. Create your first one!
                </td>
              </tr>
            ) : (
              workshops.map((workshop) => (
                <tr key={workshop.id} className="hover:bg-gray-50/50 transition-colors group">
                  <td className="px-6 py-5">
                    <div className="font-bold text-gray-900 group-hover:text-indigo-600 transition-colors">{workshop.title}</div>
                    <div className="text-xs text-gray-400 font-semibold mt-1">
                      {workshop.room} • {new Date(workshop.startTime).toLocaleString()}
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest
                      ${workshop.status === 'PUBLISHED' ? 'bg-emerald-100 text-emerald-700' : 
                        workshop.status === 'DRAFT' ? 'bg-amber-100 text-amber-700' : 
                        'bg-rose-100 text-rose-700'}`}>
                      {workshop.status}
                    </span>
                  </td>
                  <td className="px-6 py-5 font-bold text-gray-700">
                    {workshop.availableSeats} / {workshop.capacity}
                  </td>
                  <td className="px-6 py-5 font-bold text-gray-900">
                    {workshop.price === 0 ? 'FREE' : `${workshop.price.toLocaleString()}đ`}
                  </td>
                  <td className="px-6 py-5 text-right space-x-2">
                    <Link
                      to={isStaff ? `/checkin/${workshop.id}` : `/admin/workshops/${workshop.id}`}
                      className="text-xs font-black text-indigo-600 hover:text-indigo-700 uppercase tracking-widest transition-colors mr-2"
                    >
                      {isStaff ? 'Check-in' : 'View'}
                    </Link>
                    {!isStaff && workshop.status === 'DRAFT' && (
                      <button
                        onClick={() => handlePublish(workshop.id)}
                        className="text-xs font-black text-emerald-600 hover:text-emerald-700 uppercase tracking-widest"
                      >
                        Publish
                      </button>
                    )}
                    {!isStaff && (
                      <button
                        onClick={() => {
                          setEditingWorkshop(workshop);
                          setIsModalOpen(true);
                        }}
                        className="text-xs font-black text-indigo-600 hover:text-indigo-700 uppercase tracking-widest"
                      >
                        Edit
                      </button>
                    )}
                    {!isStaff && workshop.status !== 'CANCELLED' && (
                      <button
                        onClick={() => handleCancel(workshop.id)}
                        className="text-xs font-black text-rose-600 hover:text-rose-700 uppercase tracking-widest"
                      >
                        Cancel
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <WorkshopFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchWorkshops}
        workshop={editingWorkshop}
      />
    </div>
  );
};

export default AdminWorkshopsPage;
