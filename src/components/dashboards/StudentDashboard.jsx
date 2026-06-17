import React, { useState, useEffect } from 'react';
import { api } from '../../utils/api';
import Calendar from '../calendar/Calendar';
import { Book, Award, Clock, DollarSign, Search, CheckCircle, RefreshCw, Layers, Compass, FileText, Calendar as CalendarIcon } from 'lucide-react';

export default function StudentDashboard({ user, notifications, fetchNotifications, onLogout }) {
  const [sessions, setSessions] = useState([]);
  const [tutors, setTutors] = useState([]);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [paymentHistory, setPaymentHistory] = useState([]);
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  
  // Search & booking state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTutor, setSelectedTutor] = useState(null);
  const [tutorPackages, setTutorPackages] = useState([]);
  const [selectedPackage, setSelectedPackage] = useState(null);
  
  // Payment Submission Modal state
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [utrNumber, setUtrNumber] = useState('');
  const [screenshotBase64, setScreenshotBase64] = useState('');
  const [amountPaid, setAmountPaid] = useState('');
  const [paymentError, setPaymentError] = useState('');
  
  // Reschedule state
  const [rescheduleSession, setRescheduleSession] = useState(null);
  const [newDate, setNewDate] = useState('');
  const [newTime, setNewTime] = useState('');

  // Demo Modal state
  const [isDemoModalOpen, setIsDemoModalOpen] = useState(false);
  const [demoTutor, setDemoTutor] = useState(null);
  const [demoSubject, setDemoSubject] = useState('');
  const [demoDate, setDemoDate] = useState('');
  const [demoTime, setDemoTime] = useState('');
  const [demoError, setDemoError] = useState('');
  const [demoLoading, setDemoLoading] = useState(false);

  const loadData = async () => {
    try {
      const sData = await api.getSessions();
      setSessions(sData);

      const tData = await api.getTutors();
      setTutors(tData);

      const pData = await api.getPaymentHistory();
      setPaymentHistory(pData);

      const aData = await api.getAttendanceRecords();
      setAttendanceRecords(aData);
    } catch (err) {
      console.error('Error loading student data:', err.message);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleRequestDemoInitiate = (tutor) => {
    setDemoTutor(tutor);
    setIsDemoModalOpen(true);
    setDemoSubject('');
    setDemoDate('');
    setDemoTime('');
    setDemoError('');
  };

  const handleDemoSubmit = async (e) => {
    e.preventDefault();
    setDemoError('');
    setDemoLoading(true);
    try {
      await api.requestDemo({
        tutorId: demoTutor.user._id,
        subject: demoSubject,
        date: demoDate,
        startTime: demoTime
      });
      alert('Free demo class requested successfully! The teacher will receive a message to accept.');
      setIsDemoModalOpen(false);
      setDemoSubject('');
      setDemoDate('');
      setDemoTime('');
      loadData();
    } catch (err) {
      setDemoError(err.message || 'Error submitting demo request');
    } finally {
      setDemoLoading(false);
    }
  };

  const handleTutorSelect = async (tutor) => {
    setSelectedTutor(tutor);
    try {
      const pkgs = await api.getTutorPackages(tutor.user._id);
      setTutorPackages(pkgs);
      setActiveTab('book-package');
    } catch (err) {
      console.error('Error loading tutor packages:', err.message);
    }
  };

  const initiatePayment = (pkg) => {
    setSelectedPackage(pkg);
    setAmountPaid(pkg.price);
    setIsPaymentModalOpen(true);
  };

  // Convert uploaded screenshot file to base64
  const handleScreenshotChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setScreenshotBase64(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePaymentSubmit = async (e) => {
    e.preventDefault();
    setPaymentError('');
    if (!utrNumber.trim()) {
      setPaymentError('UTR/Transaction ID is required');
      return;
    }

    try {
      await api.submitPayment({
        tutorId: selectedTutor.user._id,
        packageId: selectedPackage._id,
        amount: Number(amountPaid),
        transactionId: utrNumber,
        screenshot: screenshotBase64
      });
      alert('Payment request submitted successfully. It will be reviewed in up to 5 hours.');
      setIsPaymentModalOpen(false);
      setUtrNumber('');
      setScreenshotBase64('');
      loadData();
      setActiveTab('payments');
    } catch (err) {
      setPaymentError(err.message || 'Payment submission failed');
    }
  };

  // Reschedule / Action callbacks
  const handleCalendarAction = async (action, payload) => {
    if (action === 'join') {
      try {
        await api.joinSession(payload);
        alert('Joined online class successfully. Attendance marked Present.');
        loadData();
      } catch (err) {
        alert(err.message);
      }
    } else if (action === 'confirm') {
      try {
        await api.confirmSchedule(payload);
        alert('Confirmed schedule sessions successfully!');
        loadData();
      } catch (err) {
        alert(err.message);
      }
    } else if (action === 'cancel') {
      try {
        await api.cancelSession(payload);
        alert('Session cancelled.');
        loadData();
      } catch (err) {
        alert(err.message);
      }
    } else if (action === 'reschedule-request') {
      setRescheduleSession(payload);
    }
  };

  const submitReschedule = async (e) => {
    e.preventDefault();
    if (!newDate || !newTime) return;
    try {
      await api.requestReschedule({
        sessionPostId: rescheduleSession._id,
        newDate,
        newStartTime: newTime,
        newEndTime: calculateEndTime(newTime)
      });
      alert('Reschedule request submitted successfully.');
      setRescheduleSession(null);
      setNewDate('');
      setNewTime('');
      loadData();
    } catch (err) {
      alert(err.message);
    }
  };

  const calculateEndTime = (timeStr) => {
    const [h, m] = timeStr.split(':').map(Number);
    const endH = (h + 1) % 24; // default 1 hour duration
    return `${String(endH).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  };

  const getPaymentStatusForSession = (session) => {
    if (session.payment) return 'Verified';
    
    // Find if there is a pending or accepted payment for this package and tutor
    const pendingPayment = paymentHistory.find(p => 
      p.tutor?._id === session.tutor?._id && 
      p.package?._id === session.package?._id && 
      (p.status === 'Pending Verification' || p.status === 'Package Accepted by Student')
    );
    
    if (pendingPayment) {
      return 'Pending Verification';
    }
    
    return 'Unpaid';
  };

  // Metrics
  const upcomingClasses = sessions.filter(s => s.status === 'Scheduled' || s.status === 'Pending Student Approval').length;
  const verifiedPayments = paymentHistory.filter(p => p.status === 'Verified');
  const activePackageSessions = verifiedPayments.reduce((acc, curr) => acc + curr.remainingSessions, 0);
  
  // Calculate attendance %
  const totalClasses = attendanceRecords.length;
  const presentClasses = attendanceRecords.filter(a => a.status === 'Present').length;
  const attendanceRate = totalClasses > 0 ? Math.round((presentClasses / totalClasses) * 100) : 100;

  // Filtered tutors list
  const filteredTutors = tutors.filter(t => 
    t.user?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.subjects.some(sub => sub.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Pending schedules that need student confirmation
  const pendingConfirmationSessions = sessions.filter(s => s.status === 'Pending Student Approval');

  return (
    <div style={{ display: 'flex' }}>
      {/* Sidebar */}
      <div className="sidebar">
        <div className="logo-section">
          <div className="logo-text">Mentorium EduHub</div>
        </div>
        <div className="sidebar-menu">
          <div className={`menu-item ${activeTab === 'dashboard' ? 'active' : ''}`} onClick={() => { setActiveTab('dashboard'); loadData(); }}>
            <Compass size={18} /><span>Dashboard</span>
          </div>
          <div className={`menu-item ${activeTab === 'calendar' ? 'active' : ''}`} onClick={() => { setActiveTab('calendar'); loadData(); }}>
            <CalendarIcon size={18} /><span>Calendar</span>
          </div>
          <div className={`menu-item ${activeTab === 'tutors' ? 'active' : ''}`} onClick={() => { setActiveTab('tutors'); loadData(); }}>
            <Search size={18} /><span>Find Tutors</span>
          </div>
          <div className={`menu-item ${activeTab === 'payments' ? 'active' : ''}`} onClick={() => { setActiveTab('payments'); loadData(); }}>
            <DollarSign size={18} /><span>Payments & Packages</span>
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
          <div className="navbar-title">Welcome back, <strong>{user.name}</strong></div>
          <div className="navbar-actions">
            <div className="user-profile-badge">
              <span>{user.email}</span>
              <span className="user-role-tag">Student</span>
            </div>
          </div>
        </div>

        <div className="content-area">
          {activeTab === 'dashboard' && (
            <div>
              {/* Metrics Grid */}
              <div className="stats-grid">
                <div className="stats-card">
                  <div className="stats-info">
                    <p>Upcoming Classes</p>
                    <h3>{upcomingClasses}</h3>
                  </div>
                  <div className="stats-icon"><Clock size={24} /></div>
                </div>
                <div className="stats-card">
                  <div className="stats-info">
                    <p>Attendance Rate</p>
                    <h3>{attendanceRate}%</h3>
                  </div>
                  <div className="stats-icon"><CheckCircle size={24} style={{ color: 'var(--success)' }} /></div>
                </div>
                <div className="stats-card">
                  <div className="stats-info">
                    <p>Active Package Sessions</p>
                    <h3>{activePackageSessions}</h3>
                  </div>
                  <div className="stats-icon"><Layers size={24} style={{ color: 'var(--brand-secondary)' }} /></div>
                </div>
              </div>

              {/* Pending confirmation schedules notification */}
              {pendingConfirmationSessions.length > 0 && (
                <div style={{ padding: '20px', backgroundColor: 'rgba(245,158,11,0.08)', border: '1px solid var(--warning)', borderRadius: 'var(--radius-md)', marginBottom: '32px' }}>
                  <h4 style={{ color: 'var(--warning)', marginBottom: '8px' }}>Pending Schedules to Confirm</h4>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '16px' }}>
                    Your tutor has generated a schedule. You must confirm to unlock these sessions.
                  </p>
                  <button 
                    className="btn-primary"
                    onClick={() => handleCalendarAction('confirm', pendingConfirmationSessions.map(s => s._id))}
                  >
                    Confirm All ({pendingConfirmationSessions.length} Classes)
                  </button>
                </div>
              )}

              {/* Class Schedule Grid */}
              <h3 style={{ marginBottom: '16px' }}>Your Upcoming Sessions</h3>
              <div className="table-container">
                <table className="custom-table">
                  <thead>
                    <tr>
                      <th>Subject</th>
                      <th>Tutor</th>
                      <th>Date</th>
                      <th>Time</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sessions.length === 0 ? (
                      <tr>
                        <td colSpan="6" style={{ textAlign: 'center', padding: '32px' }}>No upcoming sessions. Look up tutors to book packages!</td>
                      </tr>
                    ) : (
                      sessions.slice(0, 5).map(session => (
                        <tr key={session._id}>
                          <td><strong>{session.subject}</strong></td>
                          <td>{session.tutor?.name}</td>
                          <td>{new Date(session.date).toLocaleDateString()}</td>
                          <td>{session.startTime} - {session.endTime}</td>
                          <td>
                            {session.status === 'Pending Tutor Approval' ? (
                              <span className="badge badge-pending" style={{ backgroundColor: 'rgba(59, 130, 246, 0.1)', color: 'var(--brand-primary)' }}>
                                Demo Requested
                              </span>
                            ) : session.payment ? (
                              <span className={`badge badge-${session.status.toLowerCase().replace(/ /g, '-')}`}>
                                {session.status}
                              </span>
                            ) : (() => {
                              const payStatus = getPaymentStatusForSession(session);
                              if (payStatus === 'Pending Verification') {
                                return (
                                  <span className="badge badge-pending" style={{ backgroundColor: 'rgba(245, 158, 11, 0.1)', color: 'var(--warning)' }}>
                                    Pending Verification
                                  </span>
                                );
                              }
                              return (
                                <span className="badge badge-rejected" style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)' }}>
                                  Payment Required
                                </span>
                              );
                            })()}
                          </td>
                          <td>
                            {session.status === 'Scheduled' && (session.payment || !session.package) && (
                              <button className="btn-primary" onClick={() => handleCalendarAction('join', session._id)} style={{ padding: '6px 12px', fontSize: '0.8rem' }}>
                                Join Class
                              </button>
                            )}
                            {session.status === 'Pending Student Approval' && !session.payment && (() => {
                              const payStatus = getPaymentStatusForSession(session);
                              if (payStatus === 'Pending Verification') {
                                return (
                                  <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                                    Verification Pending
                                  </span>
                                );
                              }
                              return (
                                <button 
                                  className="btn-primary" 
                                  onClick={() => {
                                    setSelectedTutor({ user: session.tutor });
                                    initiatePayment(session.package);
                                  }} 
                                  style={{ padding: '6px 12px', fontSize: '0.8rem', backgroundColor: 'var(--warning)', color: '#000', border: 'none' }}
                                >
                                  Pay to Unlock
                                </button>
                              );
                            })()}
                            {session.status === 'Pending Student Approval' && session.payment && (
                              <button className="btn-secondary" onClick={() => handleCalendarAction('confirm', [session._id])} style={{ padding: '6px 12px', fontSize: '0.8rem', backgroundColor: 'var(--success)', color: '#fff' }}>
                                Confirm
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

          {activeTab === 'calendar' && (
            <Calendar sessions={sessions} role="student" onAction={handleCalendarAction} />
          )}

          {activeTab === 'tutors' && (
            <div>
              <div style={{ display: 'flex', gap: '16px', marginBottom: '32px' }}>
                <div style={{ position: 'relative', flex: 1 }}>
                  <input
                    type="text"
                    placeholder="Search by tutor name or subject..."
                    className="form-input"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    style={{ width: '100%', paddingLeft: '40px' }}
                  />
                  <Search size={18} style={{ position: 'absolute', left: '14px', top: '15px', color: 'var(--text-muted)' }} />
                </div>
              </div>

              <div className="tutors-list-grid">
                {filteredTutors.map(t => (
                  <div key={t._id} className="tutor-card-landing">
                    <h3>{t.user?.name}</h3>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{t.qualifications}</p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', margin: '10px 0' }}>
                      {t.subjects.map(s => (
                        <span key={s} style={{ backgroundColor: 'var(--bg-primary)', padding: '2px 8px', borderRadius: '4px', fontSize: '0.75rem' }}>{s}</span>
                      ))}
                    </div>
                    <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                      <strong>Fee:</strong> INR {t.hourlyRate} / hour
                    </div>
                    <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '12px' }}>
                      <strong>Teaching Mode:</strong> {t.teachingMode}
                    </div>
                    <button className="btn-primary" onClick={() => handleRequestDemoInitiate(t)}>Request Free Demo</button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'book-package' && selectedTutor && (
            <div>
              <button className="btn-secondary" onClick={() => setActiveTab('tutors')} style={{ marginBottom: '24px' }}>
                ← Back to Tutors
              </button>
              <h2>Select a Learning Package from <strong>{selectedTutor.user?.name}</strong></h2>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '32px' }}>Choose a package to purchase. Payments are verified manually within 5 hours.</p>

              <div className="tutors-list-grid">
                {tutorPackages.length === 0 ? (
                  <div style={{ padding: '32px', textAlign: 'center', gridColumn: '1 / -1' }}>
                    Tutor has not set up packages yet.
                  </div>
                ) : (
                  tutorPackages.filter(pkg => 
                    !paymentHistory.some(p => 
                      p.package?._id === pkg._id && 
                      (p.status === 'Package Accepted by Student' || 
                       p.status === 'Pending Verification' || 
                       (p.status === 'Verified' && p.remainingSessions > 0))
                    )
                  ).length === 0 ? (
                    <div style={{ padding: '32px', textAlign: 'center', gridColumn: '1 / -1', color: 'var(--text-secondary)' }}>
                      No available learning packages to purchase. (You already have active or pending requests for all of this tutor's packages).
                    </div>
                  ) : (
                    tutorPackages
                      .filter(pkg => 
                        !paymentHistory.some(p => 
                          p.package?._id === pkg._id && 
                          (p.status === 'Package Accepted by Student' || 
                           p.status === 'Pending Verification' || 
                           (p.status === 'Verified' && p.remainingSessions > 0))
                        )
                      )
                      .map(pkg => (
                    <div key={pkg._id} className="tutor-card-landing" style={{ borderTop: '4px solid var(--brand-primary)' }}>
                      <h3>{pkg.name}</h3>
                      <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>{pkg.description || 'No description provided.'}</p>
                      <h2 style={{ color: 'var(--brand-primary)', margin: '12px 0' }}>INR {pkg.price}</h2>
                      <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '20px' }}>
                        Total Classes: <strong>{pkg.numberOfSessions} sessions</strong>
                      </div>
                      <button className="btn-primary" onClick={() => initiatePayment(pkg)}>Purchase Package</button>
                    </div>
                  ))
                )
              )}
              </div>
            </div>
          )}

          {activeTab === 'payments' && (
            <div>
              <h3 style={{ marginBottom: '16px' }}>Your Packages & Payment History</h3>
              <div className="table-container">
                <table className="custom-table">
                  <thead>
                    <tr>
                      <th>UTR/Transaction ID</th>
                      <th>Tutor</th>
                      <th>Package</th>
                      <th>Price</th>
                      <th>Remaining Classes</th>
                      <th>Submitted Date</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paymentHistory.length === 0 ? (
                      <tr>
                        <td colSpan="7" style={{ textAlign: 'center', padding: '32px' }}>No payment requests found.</td>
                      </tr>
                    ) : (
                      paymentHistory.map(payment => (
                        <tr key={payment._id}>
                          <td><code>{payment.transactionId}</code></td>
                          <td>{payment.tutor?.name}</td>
                          <td>{payment.package?.name}</td>
                          <td>INR {payment.amount}</td>
                          <td>{payment.remainingSessions} / {payment.package?.numberOfSessions || 0}</td>
                          <td>{new Date(payment.submittedAt).toLocaleDateString()}</td>
                          <td>
                            <span className={`badge badge-${payment.status.toLowerCase().replace(/ /g, '-')}`}>
                              {payment.status}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Manual UPI Payment Modal */}
      {isPaymentModalOpen && selectedPackage && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>External UPI Payment Verification</h3>
              <button className="close-btn" onClick={() => setIsPaymentModalOpen(false)}>✕</button>
            </div>
            
            <div style={{ backgroundColor: 'var(--bg-primary)', padding: '16px', borderRadius: 'var(--radius-md)', textAlign: 'center', border: '1px solid var(--border-color)' }}>
              <p style={{ fontWeight: 'bold', fontSize: '1.1rem', marginBottom: '8px' }}>Scan to Pay</p>
              
              {/* Dynamically generate QR code using standard qrserver API */}
              <img 
                src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=upi://pay?pa=mentorium.eduhub@gmail.com%26pn=MentoriumEduHub%26am=${selectedPackage.price}%26cu=INR`} 
                alt="Payment QR Code" 
                style={{ width: '160px', height: '160px', borderRadius: 'var(--radius-sm)', border: '4px solid white', boxShadow: 'var(--shadow-sm)', marginBottom: '12px' }}
              />
              
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>UPI ID: <strong>mentorium.eduhub@gmail.com</strong></p>
              <h3 style={{ color: 'var(--brand-primary)', marginTop: '8px' }}>INR {selectedPackage.price}</h3>
            </div>

            <form onSubmit={handlePaymentSubmit}>
              {paymentError && <div style={{ color: 'var(--danger)', fontSize: '0.85rem', marginBottom: '12px' }}>{paymentError}</div>}
              
              <div className="form-group">
                <label>UTR Number / Transaction ID *</label>
                <input 
                  type="text" 
                  className="form-input" 
                  value={utrNumber} 
                  onChange={e => setUtrNumber(e.target.value)} 
                  placeholder="Enter 12-digit UTR or Txn ID"
                  required
                />
              </div>

              <div className="form-group">
                <label>Upload Payment Receipt Screenshot (Optional)</label>
                <input 
                  type="file" 
                  accept="image/*"
                  onChange={handleScreenshotChange}
                  style={{ fontSize: '0.85rem' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
                <button type="button" className="btn-secondary" style={{ flex: 1 }} onClick={() => setIsPaymentModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn-primary" style={{ flex: 1 }}>Submit UTR</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reschedule Request Modal */}
      {rescheduleSession && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Request Rescheduling</h3>
              <button className="close-btn" onClick={() => setRescheduleSession(null)}>✕</button>
            </div>
            <form onSubmit={submitReschedule}>
              <div className="form-group">
                <label>New Date</label>
                <input 
                  type="date" 
                  className="form-input" 
                  value={newDate} 
                  onChange={e => setNewDate(e.target.value)} 
                  required 
                />
              </div>
              <div className="form-group">
                <label>New Start Time</label>
                <input 
                  type="time" 
                  className="form-input" 
                  value={newTime} 
                  onChange={e => setNewTime(e.target.value)} 
                  required 
                />
              </div>
              <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
                <button type="button" className="btn-secondary" style={{ flex: 1 }} onClick={() => setRescheduleSession(null)}>Cancel</button>
                <button type="submit" className="btn-primary" style={{ flex: 1 }}>Send Request</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Free Demo Request Modal */}
      {isDemoModalOpen && demoTutor && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Request Free Demo Class</h3>
              <button className="close-btn" onClick={() => setIsDemoModalOpen(false)}>✕</button>
            </div>
            
            <div style={{ backgroundColor: 'var(--bg-primary)', padding: '12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', marginBottom: '16px' }}>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Tutor: <strong>{demoTutor.user?.name}</strong></p>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Qualifications: {demoTutor.qualifications}</p>
            </div>

            <form onSubmit={handleDemoSubmit}>
              {demoError && <div style={{ color: 'var(--danger)', fontSize: '0.85rem', marginBottom: '12px' }}>{demoError}</div>}
              
              <div className="form-group">
                <label>Subject Topic *</label>
                <input 
                  type="text" 
                  className="form-input" 
                  value={demoSubject} 
                  onChange={e => setDemoSubject(e.target.value)} 
                  placeholder="e.g. Introduction to Limits / Mechanics Overview"
                  required
                />
              </div>

              <div className="form-group">
                <label>Preferred Date *</label>
                <input 
                  type="date" 
                  className="form-input" 
                  value={demoDate} 
                  onChange={e => setDemoDate(e.target.value)} 
                  required
                />
              </div>

              <div className="form-group">
                <label>Preferred Start Time *</label>
                <input 
                  type="time" 
                  className="form-input" 
                  value={demoTime} 
                  onChange={e => setDemoTime(e.target.value)} 
                  required
                />
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
                <button type="button" className="btn-secondary" style={{ flex: 1 }} onClick={() => setIsDemoModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn-primary" style={{ flex: 1 }} disabled={demoLoading}>
                  {demoLoading ? 'Submitting...' : 'Request Demo'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
