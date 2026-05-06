import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ProtectedRoute from './components/ProtectedRoute';
import EditWorkshop from './workshops/EditWorkshop';
import WorkshopDetails from './workshops/WorkshopDetails';

const Dashboard = () => {
  const { user, logout } = useAuth();
  const demoWorkshopId = '123e4567-e89b-12d3-a456-426614174000';

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-7xl mx-auto space-y-12">
        <header className="flex justify-between items-center animate-in fade-in slide-in-from-top duration-700">
          <div>
            <div className="inline-flex items-center px-4 py-1.5 rounded-full bg-indigo-100 text-indigo-700 text-xs font-bold uppercase tracking-widest mb-4">
              Welcome back, {user?.fullName}
            </div>
            <h1 className="text-4xl font-black text-gray-900 tracking-tight sm:text-5xl">
              UniHub <span className="text-indigo-600">AI</span> Workshops
            </h1>
          </div>
          <button 
            onClick={logout}
            className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg font-bold transition-colors"
          >
            Logout
          </button>
        </header>

        <main className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start animate-in fade-in zoom-in duration-1000 delay-300">
          <section className="space-y-8">
            <div className="flex items-center space-x-3 px-2">
              <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-200">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </div>
              <h2 className="text-2xl font-black text-gray-800 tracking-tight">Admin Dashboard</h2>
            </div>
            <EditWorkshop workshopId={demoWorkshopId} />
          </section>

          <section className="space-y-8">
            <div className="flex items-center space-x-3 px-2">
              <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center shadow-lg shadow-emerald-200">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              </div>
              <h2 className="text-2xl font-black text-gray-800 tracking-tight">Student View</h2>
            </div>
            <WorkshopDetails workshopId={demoWorkshopId} />
          </section>
        </main>

        <footer className="pt-16 pb-8 border-t border-gray-100 text-center">
          <p className="text-gray-400 text-sm font-semibold tracking-widest uppercase mb-2">
            UniHub Workshop Management System
          </p>
          <div className="flex items-center justify-center space-x-2 text-gray-300">
            <span>Powered by</span>
            <span className="font-bold text-gray-400">Google Gemini</span>
            <span className="w-1 h-1 bg-gray-200 rounded-full"></span>
            <span>NestJS</span>
            <span className="w-1 h-1 bg-gray-200 rounded-full"></span>
            <span>React</span>
          </div>
        </footer>
      </div>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route element={<ProtectedRoute />}>
            <Route path="/" element={<Dashboard />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}


export default App;
