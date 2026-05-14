import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import WorkshopFormModal from '../components/WorkshopFormModal';

interface Workshop {
  id: string;
  title: string;
  room: string;
  startTime: string;
  endTime: string;
  capacity: number;
  availableSeats: number;
  price: number;
  status: 'DRAFT' | 'PUBLISHED' | 'CANCELLED';
  category: string;
  aiSummary?: string | null;
  registrationOpenAt?: string | null;
  registrationCloseAt?: string | null;
}

const PAGE_SIZE = 12;

const AdminWorkshopsPage = () => {
  const { user } = useAuth();
  const [workshops, setWorkshops] = useState<Workshop[]>([]);
  const isStaff = user?.role === 'CHECKIN_STAFF';

  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingWorkshop, setEditingWorkshop] = useState<Workshop | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'' | 'DRAFT' | 'PUBLISHED' | 'CANCELLED'>('');
  const [page, setPage] = useState(1);

  const fetchWorkshops = async (signal?: AbortSignal) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:3000/staff-portal/workshops?limit=200', {
        headers: { Authorization: `Bearer ${token}` },
        signal,
      });
      if (signal?.aborted) return;
      if (res.ok) {
        const data = await res.json();
        if (!signal?.aborted) setWorkshops(data.items ?? []);
      }
    } catch (err: any) {
      if (err?.name === 'AbortError') return;
      console.error('Failed to fetch workshops', err);
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  };

  useEffect(() => {
    const controller = new AbortController();
    const timer = setTimeout(() => {
      void fetchWorkshops(controller.signal);
    }, 150);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, []);

  const handlePublish = async (id: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:3000/staff-portal/workshops/${id}/publish`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) void fetchWorkshops();
    } catch (error) {
      console.error('Failed to publish', error);
    }
  };

  const handleCancel = async (id: string) => {
    if (!confirm('Are you sure you want to cancel this workshop?')) return;
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:3000/staff-portal/workshops/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) void fetchWorkshops();
    } catch (error) {
      console.error('Failed to cancel', error);
    }
  };

  // Client-side search + status filter
  const filtered = useMemo(() => {
    let list = workshops;
    if (statusFilter) list = list.filter((w) => w.status === statusFilter);
    const q = search.trim().toLowerCase();
    if (!q) return list;
    return list.filter(
      (w) =>
        w.title.toLowerCase().includes(q) ||
        w.room.toLowerCase().includes(q) ||
        w.category?.toLowerCase().includes(q),
    );
  }, [workshops, search, statusFilter]);

  // Reset page on filter change
  useEffect(() => {
    setPage(1);
  }, [search, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">Workshop Management</h1>
          <p className="text-gray-500 mt-1">
            {isStaff ? 'Check in students for upcoming workshops.' : 'Create and manage your workshop sessions.'}
          </p>
        </div>
        {!isStaff && (
          <button
            onClick={() => { setEditingWorkshop(null); setIsModalOpen(true); }}
            className="shrink-0 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-indigo-100 transition-all active:scale-95"
          >
            + Create Workshop
          </button>
        )}
      </div>

      {/* Search + filters bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <svg
            className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-300"
            fill="none" stroke="currentColor" viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
              d="M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search by title, room, or category…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-12 pr-10 py-3 bg-white border border-gray-200 rounded-2xl shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-medium text-gray-700 placeholder-gray-400 transition-all"
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
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as any)}
          className="px-4 py-3 bg-white border border-gray-200 rounded-2xl shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-bold text-gray-600 min-w-[140px]"
        >
          <option value="">All Statuses</option>
          <option value="DRAFT">Draft</option>
          <option value="PUBLISHED">Published</option>
          <option value="CANCELLED">Cancelled</option>
        </select>
        <span className="self-center text-sm font-bold text-gray-400 shrink-0">
          {filtered.length} workshop{filtered.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Table */}
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
                    <div className="w-8 h-8 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin" />
                    <p className="mt-4 text-gray-400 font-medium">Loading workshops...</p>
                  </div>
                </td>
              </tr>
            ) : paginated.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-gray-400 font-medium">
                  {search || statusFilter ? `No workshops match your filters.` : 'No workshops found. Create your first one!'}
                </td>
              </tr>
            ) : (
              paginated.map((workshop) => (
                <tr key={workshop.id} className="hover:bg-gray-50/50 transition-colors group">
                  <td className="px-6 py-5 max-w-xs">
                    <div className="font-bold text-gray-900 group-hover:text-indigo-600 transition-colors leading-snug line-clamp-2">
                      {workshop.title}
                    </div>
                    <div className="text-xs text-gray-400 font-semibold mt-1 truncate">
                      {workshop.room} • {new Date(workshop.startTime).toLocaleString('vi-VN')}
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
                    {Number(workshop.price) === 0 ? 'FREE' : `${Number(workshop.price).toLocaleString()}đ`}
                  </td>
                  <td className="px-6 py-5 text-right">
                    <div className="flex items-center justify-end gap-3">
                      <Link
                        to={isStaff ? `/checkin/${workshop.id}` : `/admin/workshops/${workshop.id}`}
                        className="text-xs font-black text-indigo-600 hover:text-indigo-700 uppercase tracking-widest transition-colors"
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
                      {!isStaff && new Date(workshop.startTime) > new Date() && (
                        <>
                          <button
                            onClick={() => { setEditingWorkshop(workshop); setIsModalOpen(true); }}
                            className="text-xs font-black text-indigo-600 hover:text-indigo-700 uppercase tracking-widest"
                          >
                            Edit
                          </button>
                          {workshop.status !== 'CANCELLED' && (
                            <button
                              onClick={() => handleCancel(workshop.id)}
                              className="text-xs font-black text-rose-600 hover:text-rose-700 uppercase tracking-widest"
                            >
                              Cancel
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {!loading && totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
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
                <span key={`e${i}`} className="px-2 text-gray-400 font-bold">…</span>
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
