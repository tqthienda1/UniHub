import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const RegisterPage: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    fullName: '',
    mssv: '',
  });
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, navigate]);

  const validateForm = () => {
    if (!formData.fullName.trim()) {
      setError('Full Name is required');
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError('Invalid email address');
      return false;
    }
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long');
      return false;
    }
    if (formData.mssv && formData.mssv.trim().length < 4) {
      setError('MSSV must be valid if provided');
      return false;
    }
    setError('');
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      const response = await fetch('http://localhost:3000/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (response.ok) {
        navigate('/login');
      } else {
        const data = await response.json();
        setError(data.message || 'Registration failed');
      }
    } catch (err) {
      setError('Connection error');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 px-4">
      <div className="max-w-md w-full space-y-8 p-10 bg-gray-800 rounded-2xl shadow-2xl border border-gray-700">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-white">
            Join <span className="text-blue-500">UniHub</span>
          </h2>
          <p className="mt-2 text-center text-sm text-gray-400">
            Create your student account
          </p>
        </div>
        <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
          {error && <div className="text-red-500 text-sm text-center bg-red-500/10 p-2 rounded">{error}</div>}
          <div className="space-y-3">
            <input
              type="text"
              required
              className="appearance-none block w-full px-3 py-3 border border-gray-700 placeholder-gray-500 text-white bg-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              placeholder="Full Name"
              value={formData.fullName}
              onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
            />
            <input
              type="email"
              required
              className="appearance-none block w-full px-3 py-3 border border-gray-700 placeholder-gray-500 text-white bg-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              placeholder="Email address"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
            <input
              type="text"
              className="appearance-none block w-full px-3 py-3 border border-gray-700 placeholder-gray-500 text-white bg-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              placeholder="MSSV (Optional)"
              value={formData.mssv}
              onChange={(e) => setFormData({ ...formData, mssv: e.target.value })}
            />
            <input
              type="password"
              required
              className="appearance-none block w-full px-3 py-3 border border-gray-700 placeholder-gray-500 text-white bg-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              placeholder="Password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            />
          </div>

          <div>
            <button
              type="submit"
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
            >
              Register
            </button>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-400">
              Already have an account?{' '}
              <Link to="/login" className="font-medium text-blue-500 hover:text-blue-400 transition-colors">
                Sign in
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RegisterPage;
