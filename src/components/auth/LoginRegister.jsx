import React, { useState } from 'react';
import { api } from '../../utils/api';
import { Shield, BookOpen, User, Lock, Phone, Mail, Award, DollarSign, Compass } from 'lucide-react';

export default function LoginRegister({ onAuthSuccess }) {
  const [isLogin, setIsLogin] = useState(true);
  const [role, setRole] = useState('student'); // student, tutor, admin

  // Fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  
  // Tutor fields
  const [qualifications, setQualifications] = useState('');
  const [subjects, setSubjects] = useState('');
  const [experience, setExperience] = useState('');
  const [hourlyRate, setHourlyRate] = useState('');
  const [teachingMode, setTeachingMode] = useState('online');

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        const data = await api.login(email, password);
        localStorage.setItem('mentorium_token', data.token);
        onAuthSuccess(data);
      } else {
        const formData = {
          name,
          email,
          phone,
          password,
          role,
          ...(role === 'tutor' ? {
            qualifications,
            subjects: subjects.split(',').map(s => s.trim()).filter(Boolean),
            experience: Number(experience),
            hourlyRate: Number(hourlyRate),
            teachingMode
          } : {})
        };

        const data = await api.register(formData);
        localStorage.setItem('mentorium_token', data.token);
        onAuthSuccess(data);
      }
    } catch (err) {
      setError(err.message || 'Authentication failed. Please check inputs.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h1 style={{ fontSize: '2rem', marginBottom: '8px' }}>Mentorium EduHub</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Log in to your operating system dashboard
          </p>
        </div>

        {/* Form Error */}
        {error && (
          <div style={{ backgroundColor: 'rgba(239,68,68,0.08)', border: '1px solid var(--danger)', color: 'var(--danger)', padding: '12px', borderRadius: 'var(--radius-md)', fontSize: '0.85rem' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '16px' }}>
          
          {/* Email / Username */}
          <div className="form-group">
            <label>Email or Username</label>
            <div style={{ position: 'relative' }}>
              <input 
                type="text" 
                className="form-input" 
                value={email} 
                onChange={e => setEmail(e.target.value)} 
                placeholder="you@example.com or AswinMVK" 
                style={{ width: '100%', paddingLeft: '40px' }}
                required 
              />
              <Mail size={16} style={{ position: 'absolute', left: '14px', top: '14px', color: 'var(--text-muted)' }} />
            </div>
          </div>

          {/* Phone */}
          {!isLogin && (
            <div className="form-group">
              <label>Phone Number</label>
              <div style={{ position: 'relative' }}>
                <input 
                  type="tel" 
                  className="form-input" 
                  value={phone} 
                  onChange={e => setPhone(e.target.value)} 
                  placeholder="+91 XXXXX XXXXX" 
                  style={{ width: '100%', paddingLeft: '40px' }}
                  required 
                />
                <Phone size={16} style={{ position: 'absolute', left: '14px', top: '14px', color: 'var(--text-muted)' }} />
              </div>
            </div>
          )}

          {/* Password */}
          <div className="form-group">
            <label>Password</label>
            <div style={{ position: 'relative' }}>
              <input 
                type="password" 
                className="form-input" 
                value={password} 
                onChange={e => setPassword(e.target.value)} 
                placeholder="••••••••" 
                style={{ width: '100%', paddingLeft: '40px' }}
                required 
              />
              <Lock size={16} style={{ position: 'absolute', left: '14px', top: '14px', color: 'var(--text-muted)' }} />
            </div>
          </div>

          {/* Tutor Fields if registering as tutor */}
          {!isLogin && role === 'tutor' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', borderTop: '1px solid var(--border-color)', paddingTop: '16px', marginTop: '8px' }}>
              <h4 style={{ color: 'var(--brand-primary)', marginBottom: '4px' }}>Tutor Professional Details</h4>

              <div className="form-group">
                <label>Qualifications</label>
                <div style={{ position: 'relative' }}>
                  <input 
                    type="text" 
                    className="form-input" 
                    value={qualifications} 
                    onChange={e => setQualifications(e.target.value)} 
                    placeholder="e.g. B.Tech in CSE / M.Sc Mathematics" 
                    style={{ width: '100%', paddingLeft: '40px' }}
                    required 
                  />
                  <Award size={16} style={{ position: 'absolute', left: '14px', top: '14px', color: 'var(--text-muted)' }} />
                </div>
              </div>

              <div className="form-group">
                <label>Subjects (Comma-separated)</label>
                <div style={{ position: 'relative' }}>
                  <input 
                    type="text" 
                    className="form-input" 
                    value={subjects} 
                    onChange={e => setSubjects(e.target.value)} 
                    placeholder="e.g. Mathematics, Physics, Chemistry" 
                    style={{ width: '100%', paddingLeft: '40px' }}
                    required 
                  />
                  <BookOpen size={16} style={{ position: 'absolute', left: '14px', top: '14px', color: 'var(--text-muted)' }} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label>Experience (Years)</label>
                  <input 
                    type="number" 
                    className="form-input" 
                    value={experience} 
                    onChange={e => setExperience(e.target.value)} 
                    placeholder="e.g. 5" 
                    required 
                  />
                </div>
                <div className="form-group">
                  <label>Hourly Rate (INR)</label>
                  <input 
                    type="number" 
                    className="form-input" 
                    value={hourlyRate} 
                    onChange={e => setHourlyRate(e.target.value)} 
                    placeholder="e.g. 500" 
                    required 
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Teaching Mode</label>
                <select className="form-select" value={teachingMode} onChange={e => setTeachingMode(e.target.value)}>
                  <option value="online">Online Mode Only</option>
                  <option value="offline">Offline Mode Only</option>
                  <option value="both">Both Online and Offline</option>
                </select>
              </div>
            </div>
          )}

          <button 
            type="submit" 
            className="btn-primary" 
            style={{ width: '100%', padding: '14px', fontSize: '1rem', marginTop: '12px' }}
            disabled={loading}
          >
            {loading ? 'Processing...' : isLogin ? 'Sign In' : 'Create Account'}
          </button>
        </form>
      </div>
    </div>
  );
}
