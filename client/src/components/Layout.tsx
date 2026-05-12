import React from 'react';
import { useAuth } from '../context/AuthContext';

import { Link, useLocation, Outlet } from 'react-router-dom';


const Layout: React.FC = () => {
  const { user, logout } = useAuth();
  const location = useLocation();


  const isAdmin = user?.role === 'ADMIN' || user?.role === 'CHECKIN_STAFF';

  const navItems = isAdmin 
    ? [
        { label: 'Workshops', path: '/' },
        { label: 'AI Summaries', path: '/ai-summary' },
        { label: 'Student Data', path: '/admin/students' },
      ]
    : [
        { label: 'Workshops', path: '/' },
        { label: 'My Registrations', path: '/my-registrations' },
      ];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      <header className="bg-white border-b border-gray-100 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-20">
            <div className="flex items-center space-x-12">
              <Link to="/" className="flex items-center space-x-3 group">
                <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-100 group-hover:rotate-12 transition-transform">
                  <span className="text-white font-black text-xl">U</span>
                </div>
                <span className="text-2xl font-black text-gray-900 tracking-tight">
                  UniHub <span className="text-indigo-600">Workshops</span>
                </span>
              </Link>

              <nav className="hidden md:flex space-x-2">
                {navItems.map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`px-4 py-2 rounded-xl text-sm font-black uppercase tracking-widest transition-all
                      ${location.pathname === item.path 
                        ? 'bg-indigo-50 text-indigo-600' 
                        : 'text-gray-400 hover:text-gray-900 hover:bg-gray-50'}`}
                  >
                    {item.label}
                  </Link>
                ))}
              </nav>
            </div>

            <div className="flex items-center space-x-6">
              <div className="hidden sm:block text-right">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-0.5">Logged in as</p>
                <p className="text-sm font-bold text-gray-900">{user?.fullName}</p>
              </div>
              <button 
                onClick={logout}
                className="w-10 h-10 flex items-center justify-center rounded-xl bg-gray-100 hover:bg-rose-50 text-gray-400 hover:text-rose-600 transition-all group"
                title="Logout"
              >
                <svg className="w-5 h-5 group-hover:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Outlet />
      </main>


      <footer className="bg-white border-t border-gray-100 py-12">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-[10px] font-black text-gray-300 uppercase tracking-[0.3em] mb-6">
            UniHub Workshop Management System
          </p>
          <div className="flex items-center justify-center space-x-6 text-gray-400">
            <span className="flex items-center">
              <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full mr-2"></div>
              Gemini AI
            </span>
            <span className="flex items-center">
              <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full mr-2"></div>
              NestJS
            </span>
            <span className="flex items-center">
              <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full mr-2"></div>
              React
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Layout;
