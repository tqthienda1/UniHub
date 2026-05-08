import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

import { AuthProvider, useAuth } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import LoginPage from './pages/LoginPage';

import RegisterPage from './pages/RegisterPage';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';

// Pages
import StudentWorkshopsPage from './pages/StudentWorkshopsPage';
import AdminWorkshopsPage from './pages/AdminWorkshopsPage';
import AdminWorkshopDetail from './pages/AdminWorkshopDetail';
import MyRegistrationsPage from './pages/MyRegistrationsPage';
import EditWorkshop from './workshops/EditWorkshop';
import WorkshopDetails from './workshops/WorkshopDetails';
import CheckInPage from './pages/CheckInPage';

const Dashboard = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN' || user?.role === 'CHECKIN_STAFF';

  return isAdmin ? <AdminWorkshopsPage /> : <StudentWorkshopsPage />;
};

const AiSummaryPage = () => {
  const demoWorkshopId = '123e4567-e89b-12d3-a456-426614174000'; // Temporary fallback
  return (
    <div className="max-w-4xl mx-auto space-y-12">
      <div className="text-center">
        <h1 className="text-4xl font-black text-gray-900 tracking-tight">AI Content Generation</h1>
        <p className="text-gray-500 mt-2">Generate summaries from workshop PDF documents.</p>
      </div>
      <EditWorkshop workshopId={demoWorkshopId} />
    </div>
  );
};

function App() {
  return (
    <NotificationProvider>
      <AuthProvider>
        <Router>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            
            <Route element={<ProtectedRoute />}>
              <Route element={<Layout />}>
                <Route index element={<Dashboard />} />
                <Route path="ai-summary" element={<AiSummaryPage />} />
                <Route path="admin/workshops/:id" element={<AdminWorkshopDetail />} />
                <Route path="checkin/:id" element={<CheckInPage />} />
                <Route path="my-registrations" element={<MyRegistrationsPage />} />
                <Route path="workshops/:id" element={<WorkshopDetails />} />
              </Route>
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Router>
      </AuthProvider>
    </NotificationProvider>
  );
}



export default App;
