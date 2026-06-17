import React, { useState, useEffect } from 'react';
import { api } from '../../utils/api';
import { Shield, Users, DollarSign, Calendar, CheckCircle, Eye, Check, X, Award, BarChart, UserPlus, Trash2 } from 'lucide-react';

export default function AdminDashboard({ user, onLogout }) {
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [pendingPayments, setPendingPayments] = useState([]);
  const [activeTab, setActiveTab] = useState('dashboard');
  
  // Verification details
  const [remarks, setRemarks] = useState('');
  const [activeVerifyId, setActiveVerifyId] = useState(null);
  const [screenshotUrl, setScreenshotUrl] = useState(null);

  // Create user fields
  const [createRole, setCreateRole] = useState('student');
  const [createName, setCreateName] = useState('');
  const [createEmail, setCreateEmail] = useState('');
  const [createPhone, setCreatePhone] = useState('');
  const [createPassword, setCreatePassword] = useState('');
  
  // Tutor fields for creation
  const [createQual, setCreateQual] = useState('');
  const [createSubjects, setCreateSubjects] = useState('');
  const [createExperience, setCreateExperience] = useState('');
  const [createRate, setCreateRate] = useState('');
  const [createMode, setCreateMode] = useState('online');

  const [formSuccess, setFormSuccess] = useState('');
  const [formError, setFormError] = useState('');
  const [formLoading, setFormLoading] = useState(false);

  const loadData = async () => {
    try {
      const statsData = await api.getAdminStats();
      setStats(statsData);

      const usersList = await api.getUsersList();
      setUsers(usersList);

      const payments = await api.getPendingPayments();
      setPendingPayments(payments);
    } catch (err) {
      console.error('Error loading admin data:', err.message);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleVerify = async (id, approve) => {
    try {
      if (approve) {
        await api.verifyPayment(id, remarks);
        alert('Payment request approved.');
      } else {
        await api.rejectPayment(id, remarks);
        alert('Payment request rejected.');
      }
      setActiveVerifyId(null);
      setRemarks('');
      loadData();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');
    setFormLoading(true);

    try {
      const formData = {
        name: createName,
        email: createEmail,
        phone: createPhone,
        password: createPassword,
        role: createRole,
        ...(createRole === 'tutor' ? {
          qualifications: createQual,
          subjects: createSubjects.split(',').map(s => s.trim()).filter(Boolean),
          experience: Number(createExperience),
          hourlyRate: Number(createRate),
          teachingMode: createMode
        } : {})
      };

      await api.register(formData);
      setFormSuccess(`Successfully registered new ${createRole} user: ${createName}`);
      
      // Reset fields
      setCreateName('');
      setCreateEmail('');
      setCreatePhone('');
      setCreatePassword('');
      setCreateQual('');
      setCreateSubjects('');
      setCreateExperience('');
      setCreateRate('');
      setCreateMode('online');
      
      // Reload list
      loadData();
    } catch (err) {
      setFormError(err.message || 'Error creating user');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteUser = async (id, name) => {
    if (window.confirm(`Are you sure you want to permanently delete user "${name}"?`)) {
      try {
        await api.deleteUser(id);
        alert('User deleted successfully.');
        loadData();
      } catch (err) {
        alert(err.message || 'Error deleting user');
      }
    }
  };

  return (
    <div style={{ display: 'flex' }}>
      {/* Sidebar */}
      <div className="sidebar">
        <div className="logo-section">
          <div className="logo-text">Mentorium Admin</div>
        </div>
        <div className="sidebar-menu">
          <div className={`menu-item ${activeTab === 'dashboard' ? 'active' : ''}`} onClick={() => { setActiveTab('dashboard'); loadData(); }}>
            <BarChart size={18} /><span>Dashboard</span>
          </div>
          <div className={`menu-item ${activeTab === 'users' ? 'active' : ''}`} onClick={() => { setActiveTab('users'); loadData(); }}>
            <Users size={18} /><span>User Manager</span>
          </div>
          <div className={`menu-item ${activeTab === 'create-user' ? 'active' : ''}`} onClick={() => { setActiveTab('create-user'); }}>
            <UserPlus size={18} /><span>Create User</span>
          </div>
          <div className={`menu-item ${activeTab === 'verifications' ? 'active' : ''}`} onClick={() => { setActiveTab('verifications'); loadData(); }}>
            <CheckCircle size={18} />
            <span>Verification Log</span>
            {pendingPayments.length > 0 && (
              <span className="badge badge-rejected" style={{ marginLeft: 'auto', padding: '2px 6px' }}>{pendingPayments.length}</span>
            )}
          </div>
        </div>
        <div className="theme-toggle-container">
          <button className="btn-secondary" onClick={onLogout} style={{ width: '100%', color: 'var(--danger)', borderColor: 'var(--danger)' }}>
            Logout
          </button>
        </div>
      </div>

      <div className="main-wrapper">
        <div className="top-navbar">
          <div className="navbar-title">Portal Administration</div>
          <div className="navbar-actions">
            <div className="user-profile-badge">
              <span>{user.email}</span>
              <span className="user-role-tag admin-role-tag">Admin</span>
            </div>
          </div>
        </div>

        <div className="content-area">
          {activeTab === 'dashboard' && stats && (
            <div>
              {/* Metrics Grid */}
              <div className="stats-grid">
                <div className="stats-card">
                  <div className="stats-info">
                    <p>Total Tutors</p>
                    <h3>{stats.totalTutors}</h3>
                  </div>
                  <div className="stats-icon"><Users size={24} style={{ color: 'var(--brand-primary)' }} /></div>
                </div>
                <div className="stats-card">
                  <div className="stats-info">
                    <p>Total Students</p>
                    <h3>{stats.totalStudents}</h3>
                  </div>
                  <div className="stats-icon"><Users size={24} style={{ color: 'var(--brand-secondary)' }} /></div>
                </div>
                <div className="stats-card">
                  <div className="stats-info">
                    <p>Pending Payments</p>
                    <h3>{stats.pendingPayments}</h3>
                  </div>
                  <div className="stats-icon"><CheckCircle size={24} style={{ color: 'var(--warning)' }} /></div>
                </div>
                <div className="stats-card">
                  <div className="stats-info">
                    <p>Active Classes</p>
                    <h3>{stats.activeClasses}</h3>
                  </div>
                  <div className="stats-icon"><Calendar size={24} style={{ color: 'var(--info)' }} /></div>
                </div>
              </div>

              {/* Earnings Panel */}
              <div style={{ backgroundColor: 'var(--bg-secondary)', padding: '24px', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)', marginBottom: '32px' }}>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Cumulative Escrow Payments Collected</p>
                <h1 style={{ fontSize: '3rem', color: 'var(--success)' }}>INR {stats.totalEarnings}</h1>
              </div>

              {/* Monthly earnings */}
              <h3>Recent Monthly Activity</h3>
              <div className="table-container" style={{ marginTop: '16px' }}>
                <table className="custom-table">
                  <thead>
                    <tr>
                      <th>Year</th>
                      <th>Month</th>
                      <th>Revenue (INR)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.monthlyStats?.length === 0 ? (
                      <tr>
                        <td colSpan="3" style={{ textAlign: 'center', padding: '16px' }}>No monthly records yet.</td>
                      </tr>
                    ) : (
                      stats.monthlyStats?.map((m, idx) => (
                        <tr key={idx}>
                          <td><strong>{m._id.year}</strong></td>
                          <td>{new Date(m._id.year, m._id.month - 1).toLocaleString('default', { month: 'long' })}</td>
                          <td>INR {m.earnings}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'users' && (
            <div>
              <h3>User Directory</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '16px' }}>All registered student, tutor, and administrator accounts.</p>

              <div className="table-container">
                <table className="custom-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Phone</th>
                      <th>Role</th>
                      <th>Joined Date</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map(u => (
                      <tr key={u._id}>
                        <td><strong>{u.name}</strong></td>
                        <td>{u.email}</td>
                        <td>{u.phone}</td>
                        <td>
                          <span className={`user-role-tag ${u.role === 'tutor' ? 'tutor-role-tag' : u.role === 'admin' ? 'admin-role-tag' : ''}`}>
                            {u.role === 'tutor' ? 'teacher' : u.role}
                          </span>
                        </td>
                        <td>{new Date(u.createdAt).toLocaleDateString()}</td>
                        <td>
                          {u.role !== 'admin' ? (
                            <button 
                              onClick={() => handleDeleteUser(u._id, u.name)}
                              style={{ 
                                background: 'none', 
                                border: 'none', 
                                color: 'var(--danger)', 
                                cursor: 'pointer',
                                padding: '4px 8px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px',
                                transition: 'opacity 0.2s'
                              }}
                              title="Delete User"
                              onMouseOver={e => e.currentTarget.style.opacity = 0.7}
                              onMouseOut={e => e.currentTarget.style.opacity = 1}
                            >
                              <Trash2 size={16} /> Delete
                            </button>
                          ) : (
                            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>System Protected</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'verifications' && (
            <div>
              <h3>Admin Escrow Review Logging</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '16px' }}>
                Confirm offline manual UPI transaction screenshots and UTR transaction numbers globally.
              </p>

              <div className="table-container">
                <table className="custom-table">
                  <thead>
                    <tr>
                      <th>Student</th>
                      <th>Tutor</th>
                      <th>Package</th>
                      <th>Amount</th>
                      <th>UTR/Transaction ID</th>
                      <th>Receipt</th>
                      <th>Remarks</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pendingPayments.length === 0 ? (
                      <tr>
                        <td colSpan="8" style={{ textAlign: 'center', padding: '32px' }}>No global pending payment requests.</td>
                      </tr>
                    ) : (
                      pendingPayments.map(payment => (
                        <tr key={payment._id}>
                          <td><strong>{payment.student?.name}</strong></td>
                          <td>{payment.tutor?.name}</td>
                          <td>{payment.package?.name}</td>
                          <td>INR {payment.amount}</td>
                          <td><code>{payment.transactionId}</code></td>
                          <td>
                            {payment.screenshot ? (
                              <button className="btn-secondary" onClick={() => setScreenshotUrl(payment.screenshot)} style={{ padding: '4px 8px', fontSize: '0.75rem' }}>
                                <Eye size={12} /> View Screenshot
                              </button>
                            ) : (
                              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>No image</span>
                            )}
                          </td>
                          <td>
                            {activeVerifyId === payment._id ? (
                              <input
                                type="text"
                                className="form-input"
                                placeholder="Add remarks..."
                                value={remarks}
                                onChange={e => setRemarks(e.target.value)}
                                style={{ padding: '6px', fontSize: '0.8rem' }}
                              />
                            ) : (
                              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>-</span>
                            )}
                          </td>
                          <td>
                            {activeVerifyId === payment._id ? (
                              <div style={{ display: 'flex', gap: '6px' }}>
                                <button className="btn-primary" onClick={() => handleVerify(payment._id, true)} style={{ padding: '6px', backgroundColor: 'var(--success)' }}>
                                  <Check size={14} />
                                </button>
                                <button className="btn-secondary" onClick={() => handleVerify(payment._id, false)} style={{ padding: '6px', color: 'var(--danger)', borderColor: 'var(--danger)' }}>
                                  <X size={14} />
                                </button>
                              </div>
                            ) : (
                              <button className="btn-primary" onClick={() => { setActiveVerifyId(payment._id); setRemarks(''); }} style={{ padding: '6px 12px', fontSize: '0.75rem' }}>
                                Review
                              </button>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'create-user' && (
            <div style={{ maxWidth: '600px', backgroundColor: 'var(--bg-secondary)', padding: '24px', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)' }}>
              <h3 style={{ marginBottom: '8px' }}>Create Student or Teacher</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '20px' }}>Register new users onto the platform. These users will then be able to log in.</p>

              {formSuccess && (
                <div style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', border: '1px solid var(--success)', color: 'var(--success)', padding: '12px', borderRadius: 'var(--radius-md)', fontSize: '0.85rem', marginBottom: '16px' }}>
                  {formSuccess}
                </div>
              )}
              {formError && (
                <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid var(--danger)', color: 'var(--danger)', padding: '12px', borderRadius: 'var(--radius-md)', fontSize: '0.85rem', marginBottom: '16px' }}>
                  {formError}
                </div>
              )}

              <form onSubmit={handleCreateUser} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div className="form-group">
                  <label>Select User Role</label>
                  <div style={{ display: 'flex', gap: '12px', marginTop: '6px' }}>
                    <button 
                      type="button" 
                      className={`btn-secondary ${createRole === 'student' ? 'btn-primary' : ''}`}
                      onClick={() => setCreateRole('student')}
                      style={{ flex: 1, padding: '8px 16px', fontSize: '0.85rem' }}
                    >
                      Student
                    </button>
                    <button 
                      type="button" 
                      className={`btn-secondary ${createRole === 'tutor' ? 'btn-primary' : ''}`}
                      onClick={() => setCreateRole('tutor')}
                      style={{ flex: 1, padding: '8px 16px', fontSize: '0.85rem' }}
                    >
                      Teacher (Tutor)
                    </button>
                  </div>
                </div>

                <div className="form-group">
                  <label>Full Name</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    placeholder="e.g. John Doe"
                    value={createName}
                    onChange={e => setCreateName(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Email Address</label>
                  <input 
                    type="email" 
                    className="form-input" 
                    placeholder="e.g. user@example.com"
                    value={createEmail}
                    onChange={e => setCreateEmail(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Phone Number</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    placeholder="e.g. +91 99999 99999"
                    value={createPhone}
                    onChange={e => setCreatePhone(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Password</label>
                  <input 
                    type="password" 
                    className="form-input" 
                    placeholder="••••••••"
                    value={createPassword}
                    onChange={e => setCreatePassword(e.target.value)}
                    required
                  />
                </div>

                {createRole === 'tutor' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', borderTop: '1px solid var(--border-color)', paddingTop: '16px', marginTop: '8px' }}>
                    <h4 style={{ color: 'var(--brand-primary)', marginBottom: '4px' }}>Teacher Professional Details</h4>

                    <div className="form-group">
                      <label>Qualifications</label>
                      <input 
                        type="text" 
                        className="form-input" 
                        placeholder="e.g. B.Tech in CSE / M.Sc Mathematics" 
                        value={createQual}
                        onChange={e => setCreateQual(e.target.value)}
                        required 
                      />
                    </div>

                    <div className="form-group">
                      <label>Subjects (Comma-separated)</label>
                      <input 
                        type="text" 
                        className="form-input" 
                        placeholder="e.g. Mathematics, Physics, Chemistry" 
                        value={createSubjects}
                        onChange={e => setCreateSubjects(e.target.value)}
                        required 
                      />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                      <div className="form-group">
                        <label>Experience (Years)</label>
                        <input 
                          type="number" 
                          className="form-input" 
                          placeholder="e.g. 5" 
                          value={createExperience}
                          onChange={e => setCreateExperience(e.target.value)}
                          required 
                        />
                      </div>
                      <div className="form-group">
                        <label>Hourly Rate (INR)</label>
                        <input 
                          type="number" 
                          className="form-input" 
                          placeholder="e.g. 500" 
                          value={createRate}
                          onChange={e => setCreateRate(e.target.value)}
                          required 
                        />
                      </div>
                    </div>

                    <div className="form-group">
                      <label>Teaching Mode</label>
                      <select className="form-select" value={createMode} onChange={e => setCreateMode(e.target.value)}>
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
                  disabled={formLoading}
                >
                  {formLoading ? 'Creating User...' : `Create ${createRole === 'student' ? 'Student' : 'Teacher'}`}
                </button>
              </form>
            </div>
          )}
        </div>
      </div>

      {/* Screenshot Modal */}
      {screenshotUrl && (
        <div className="modal-overlay" onClick={() => setScreenshotUrl(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '600px', textAlign: 'center' }}>
            <div className="modal-header">
              <h3>Receipt Screenshot</h3>
              <button className="close-btn" onClick={() => setScreenshotUrl(null)}>✕</button>
            </div>
            <img src={screenshotUrl} alt="Receipt Screenshot" style={{ maxWidth: '100%', maxHeight: '70vh', marginTop: '12px', borderRadius: 'var(--radius-sm)' }} />
          </div>
        </div>
      )}
    </div>
  );
}
