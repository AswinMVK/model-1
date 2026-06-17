import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import { api } from './utils/api';
import LandingPage from './components/landing/LandingPage';
import LoginRegister from './components/auth/LoginRegister';
import StudentDashboard from './components/dashboards/StudentDashboard';
import TutorDashboard from './components/dashboards/TutorDashboard';
import AdminDashboard from './components/dashboards/AdminDashboard';
import './App.css';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState([]);
  const [theme, setTheme] = useState(localStorage.getItem('mentorium_theme') || 'light');
  const navigate = useNavigate();

  // Load theme on startup
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('mentorium_theme', newTheme);
  };

  const checkUserSession = async () => {
    const token = localStorage.getItem('mentorium_token');
    if (!token) {
      setLoading(false);
      return;
    }
    try {
      const userData = await api.getProfile();
      setUser(userData);
      fetchNotifications();
    } catch (err) {
      console.warn('Session expired:', err.message);
      localStorage.removeItem('mentorium_token');
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const fetchNotifications = async () => {
    try {
      const data = await api.getNotifications();
      setNotifications(data);
    } catch (err) {}
  };

  useEffect(() => {
    checkUserSession();
  }, []);

  const handleAuthSuccess = (userData) => {
    setUser(userData);
    fetchNotifications();
    if (userData.role === 'student') navigate('/student-dashboard');
    else if (userData.role === 'tutor') navigate('/tutor-dashboard');
    else if (userData.role === 'admin') navigate('/admin-dashboard');
  };

  const handleLogout = () => {
    localStorage.removeItem('mentorium_token');
    setUser(null);
    navigate('/');
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--bg-primary)' }}>
        <div style={{ textAlign: 'center' }}>
          <h2 style={{ color: 'var(--brand-primary)', marginBottom: '12px' }}>Mentorium EduHub</h2>
          <p style={{ color: 'var(--text-secondary)' }}>Loading system operating dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ position: 'relative' }}>
      
      {/* Floating Theme Toggle */}
      <button 
        onClick={toggleTheme}
        style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          width: '48px',
          height: '48px',
          borderRadius: '50%',
          backgroundColor: 'var(--bg-secondary)',
          border: '1px solid var(--border-color)',
          color: 'var(--text-primary)',
          cursor: 'pointer',
          boxShadow: 'var(--shadow-md)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '1.25rem',
          transition: 'all var(--transition-fast)'
        }}
        title="Toggle Light/Dark Theme"
      >
        {theme === 'light' ? '🌙' : '☀️'}
      </button>

      <Routes>
        {/* Landing Page */}
        <Route path="/" element={
          user ? (
            user.role === 'student' ? <StudentDashboard user={user} notifications={notifications} fetchNotifications={fetchNotifications} onLogout={handleLogout} /> :
            user.role === 'tutor' ? <TutorDashboard user={user} notifications={notifications} fetchNotifications={fetchNotifications} onLogout={handleLogout} /> :
            <AdminDashboard user={user} onLogout={handleLogout} />
          ) : (
            <LandingPage onEnterApp={() => navigate('/auth')} />
          )
        } />

        {/* Auth Page */}
        <Route path="/auth" element={<LoginRegister onAuthSuccess={handleAuthSuccess} />} />

        {/* Role Dashboards */}
        <Route path="/student-dashboard" element={
          user && user.role === 'student' ? (
            <StudentDashboard user={user} notifications={notifications} fetchNotifications={fetchNotifications} onLogout={handleLogout} />
          ) : (
            <LoginRegister onAuthSuccess={handleAuthSuccess} />
          )
        } />

        <Route path="/tutor-dashboard" element={
          user && user.role === 'tutor' ? (
            <TutorDashboard user={user} notifications={notifications} fetchNotifications={fetchNotifications} onLogout={handleLogout} />
          ) : (
            <LoginRegister onAuthSuccess={handleAuthSuccess} />
          )
        } />

        <Route path="/admin-dashboard" element={
          user && user.role === 'admin' ? (
            <AdminDashboard user={user} onLogout={handleLogout} />
          ) : (
            <LoginRegister onAuthSuccess={handleAuthSuccess} />
          )
        } />
      </Routes>
    </div>
  );
}

export default App;
