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
import WorkshopDetails from './workshops/WorkshopDetails';
import CheckInPage from './pages/CheckInPage';
import AdminStudentsPage from './pages/AdminStudentsPage';

const Dashboard = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN' || user?.role === 'CHECKIN_STAFF';

  return isAdmin ? <AdminWorkshopsPage /> : <StudentWorkshopsPage />;
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
                <Route path="admin/workshops/:id" element={<AdminWorkshopDetail />} />
                <Route path="admin/students" element={<AdminStudentsPage />} />
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
