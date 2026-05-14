import { useState, useEffect, useMemo } from 'react';

interface Student {
  mssv: string;
  email: string;
  fullName: string;
  createdAt: string;
}

const PAGE_SIZE = 15;

const AdminStudentsPage = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const fetchStudents = async (signal?: AbortSignal) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3000/sync/students', {
        headers: { Authorization: `Bearer ${token}` },
        signal,
      });
      if (signal?.aborted) return;
      if (response.ok) {
        const data = await response.json();
        if (!signal?.aborted) setStudents(data);
      }
    } catch (err: any) {
      if (err?.name === 'AbortError') return;
      console.error('Failed to fetch students', err);
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  };

  const handleSync = async () => {
    setSyncing(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3000/sync/students', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        alert('Sync triggered! Please refresh in a few moments.');
        setTimeout(() => void fetchStudents(), 2000);
      }
    } catch (error) {
      console.error('Failed to trigger sync', error);
      alert('Failed to trigger sync.');
    } finally {
      setSyncing(false);
    }
  };

  useEffect(() => {
    const controller = new AbortController();
    const timer = setTimeout(() => {
      void fetchStudents(controller.signal);
    }, 150);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, []);

  // Client-side search
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return students;
    return students.filter(
      (s) =>
        s.mssv.toLowerCase().includes(q) ||
        s.fullName.toLowerCase().includes(q) ||
        s.email.toLowerCase().includes(q),
    );
  }, [students, search]);

  // Reset page on search change
  useEffect(() => {
    setPage(1);
  }, [search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">Student Data Sync</h1>
          <p className="text-gray-500 mt-1">Manage and monitor synchronized student records from Legacy SIS.</p>
        </div>
        <button
          onClick={handleSync}
          disabled={syncing}
          className="shrink-0 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-indigo-100 transition-all active:scale-95 flex items-center"
        >
          {syncing ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
              Syncing...
            </>
          ) : (
            'Trigger Sync Now'
          )}
        </button>
      </div>

      {/* Search + count */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
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
            placeholder="Search by MSSV, name, or email…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-12 pr-10 py-3 bg-white border border-gray-200 rounded-2xl shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm font-medium text-gray-700 placeholder-gray-400 transition-all"
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
        <span className="text-sm font-bold text-gray-400 shrink-0">
          {filtered.length} student{filtered.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Table */}
      <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-widest">MSSV</th>
              <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-widest">Full Name</th>
              <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-widest">Email</th>
              <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-widest">Synced Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {loading ? (
              <tr>
                <td colSpan={4} className="px-6 py-12 text-center">
                  <div className="flex flex-col items-center">
                    <div className="w-8 h-8 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin" />
                    <p className="mt-4 text-gray-400 font-medium">Loading students...</p>
                  </div>
                </td>
              </tr>
            ) : paginated.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-12 text-center text-gray-400 font-medium">
                  {search ? `No students match "${search}"` : 'No synchronized students found.'}
                </td>
              </tr>
            ) : (
              paginated.map((student) => (
                <tr key={student.mssv} className="hover:bg-gray-50/50 transition-colors group">
                  <td className="px-6 py-5 font-black text-indigo-600 font-mono">{student.mssv}</td>
                  <td className="px-6 py-5 font-bold text-gray-900">{student.fullName}</td>
                  <td className="px-6 py-5 text-gray-600 font-medium">{student.email}</td>
                  <td className="px-6 py-5 text-gray-400 text-xs font-bold">
                    {new Date(student.createdAt).toLocaleString('vi-VN')}
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
    </div>
  );
};

export default AdminStudentsPage;
