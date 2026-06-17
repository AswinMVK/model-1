import React, { useState, useEffect } from 'react';
import { api } from '../../utils/api';
import Calendar from '../calendar/Calendar';
import { Users, Clock, DollarSign, Calendar as CalIcon, CheckCircle, Plus, Eye, Check, X, ShieldAlert } from 'lucide-react';

export default function TutorDashboard({ user, notifications, fetchNotifications, onLogout }) {
  const [sessions, setSessions] = useState([]);
  const [studentsList, setStudentsList] = useState([]);
  const [pendingPayments, setPendingPayments] = useState([]);
  const [paymentHistory, setPaymentHistory] = useState([]);
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [activeTab, setActiveTab] = useState('dashboard');

  // Package creation state
  const [packageName, setPackageName] = useState('');
  const [packageType, setPackageType] = useState('single');
  const [packagePrice, setPackagePrice] = useState('');
  const [packageSessions, setPackageSessions] = useState('');
  const [packageDesc, setPackageDesc] = useState('');

  // Schedule creator state
  const [selectedStudent, setSelectedStudent] = useState('');
  const [selectedPackage, setSelectedPackage] = useState('');
  const [tutorPackages, setTutorPackages] = useState([]);
  const [subject, setSubject] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedDays, setSelectedDays] = useState([]);
  const [startTime, setStartTime] = useState('');
  const [durationHours, setDurationHours] = useState('1');
  const [scheduleError, setScheduleError] = useState('');

  // Verification Remarks state
  const [verificationRemarks, setVerificationRemarks] = useState('');
  const [activeVerifyId, setActiveVerifyId] = useState(null);
  const [viewScreenshotUrl, setViewScreenshotUrl] = useState(null);

  const loadData = async () => {
    try {
      const sData = await api.getSessions();
      setSessions(sData);

      const pData = await api.getPendingPayments();
      setPendingPayments(pData);

      const hData = await api.getPaymentHistory();
      setPaymentHistory(hData);

      const aData = await api.getAttendanceRecords();
      setAttendanceRecords(aData);

      // Load all students to allow prepaid scheduling
      const allStudents = await api.getStudents();
      setStudentsList(allStudents);

      // Load this tutor's packages
      const pkgs = await api.getTutorPackages(user._id);
      setTutorPackages(pkgs);
    } catch (err) {
      console.error('Error loading tutor data:', err.message);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreatePackage = async (e) => {
    e.preventDefault();
    try {
      await api.createPackage({
        name: packageName,
        type: packageType,
        price: Number(packagePrice),
        numberOfSessions: Number(packageSessions),
        description: packageDesc
      });
      alert('Package created successfully.');
      setPackageName('');
      setPackagePrice('');
      setPackageSessions('');
      setPackageDesc('');
      loadData();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDayToggle = (day) => {
    if (selectedDays.includes(day)) {
      setSelectedDays(selectedDays.filter(d => d !== day));
    } else {
      setSelectedDays([...selectedDays, day]);
    }
  };

  const handleGenerateSchedule = async (e) => {
    e.preventDefault();
    setScheduleError('');

    if (!selectedStudent || !selectedPackage || !subject || !startDate || !endDate || selectedDays.length === 0 || !startTime) {
      setScheduleError('All scheduling fields including package selection are required.');
      return;
    }

    try {
      const result = await api.createSchedule({
        studentId: selectedStudent,
        packageId: selectedPackage,
        subject,
        startDate,
        endDate,
        daysOfWeek: selectedDays,
        startTime,
        durationHours: Number(durationHours)
      });

      alert(result.message);
      if (result.conflicts && result.conflicts.length > 0) {
        alert(`Conflicts skipped:\n${result.conflicts.join('\n')}`);
      }

      // Reset form
      setSelectedStudent('');
      setSelectedPackage('');
      setSubject('');
      setStartDate('');
      setEndDate('');
      setSelectedDays([]);
      setStartTime('');
      setDurationHours('1');
      loadData();
      setActiveTab('calendar');
    } catch (err) {
      setScheduleError(err.message || 'Failed to generate schedule');
    }
  };

  const handleVerifyPayment = async (id, approve) => {
    try {
      if (approve) {
        await api.verifyPayment(id, verificationRemarks);
        alert('Payment verified and activated.');
      } else {
        await api.rejectPayment(id, verificationRemarks);
        alert('Payment request rejected.');
      }
      setActiveVerifyId(null);
      setVerificationRemarks('');
      loadData();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleCalendarAction = async (action, payload) => {
    if (action === 'attendance-present') {
      try {
        await api.markAttendance(payload._id, {
          studentId: payload.student._id,
          status: 'Present'
        });
        alert('Student marked Present.');
        loadData();
      } catch (err) {
        alert(err.message);
      }
    } else if (action === 'attendance-absent') {
      try {
        await api.markAttendance(payload._id, {
          studentId: payload.student._id,
          status: 'Absent'
        });
        alert('Student marked Absent.');
        loadData();
      } catch (err) {
        alert(err.message);
      }
    } else if (action === 'demo-accept') {
      try {
        await api.acceptDemo(payload);
        alert('Demo request accepted successfully!');
        loadData();
      } catch (err) {
        alert(err.message || 'Error accepting demo request');
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
      const newD = prompt('Enter New Date (YYYY-MM-DD):');
      const newT = prompt('Enter New Time (HH:MM):');
      if (newD && newT) {
        try {
          await api.requestReschedule({
            sessionPostId: payload._id,
            newDate: newD,
            newStartTime: newT,
            newEndTime: calculateEndTime(newT)
          });
          alert('Reschedule request sent.');
          loadData();
        } catch (err) {
          alert(err.message);
        }
      }
    }
  };

  const calculateEndTime = (timeStr) => {
    const [h, m] = timeStr.split(':').map(Number);
    const endH = (h + 1) % 24;
    return `${String(endH).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  };

  // Metrics
  const totalStudents = studentsList.length;
  const classesToday = sessions.filter(s => new Date(s.date).toDateString() === new Date().toDateString()).length;
  const totalEarnings = paymentHistory
    .filter(p => p.status === 'Verified')
    .reduce((acc, curr) => acc + curr.amount, 0);

  // Present rate
  const totalTutorSessions = attendanceRecords.length;
  const presentSessions = attendanceRecords.filter(a => a.status === 'Present').length;
  const attendanceRate = totalTutorSessions > 0 ? Math.round((presentSessions / totalTutorSessions) * 100) : 100;

  return (
    <div style={{ display: 'flex' }}>
      {/* Sidebar */}
      <div className="sidebar">
        <div className="logo-section">
          <div className="logo-text">Mentorium EduHub</div>
        </div>
        <div className="sidebar-menu">
          <div className={`menu-item ${activeTab === 'dashboard' ? 'active' : ''}`} onClick={() => { setActiveTab('dashboard'); loadData(); }}>
            <CalIcon size={18} /><span>Dashboard</span>
          </div>
          <div className={`menu-item ${activeTab === 'calendar' ? 'active' : ''}`} onClick={() => { setActiveTab('calendar'); loadData(); }}>
            <Clock size={18} /><span>Calendar</span>
          </div>
          <div className={`menu-item ${activeTab === 'scheduler' ? 'active' : ''}`} onClick={() => { setActiveTab('scheduler'); loadData(); }}>
            <Plus size={18} /><span>Schedule Creator</span>
          </div>
          <div className={`menu-item ${activeTab === 'packages' ? 'active' : ''}`} onClick={() => { setActiveTab('packages'); loadData(); }}>
            <Users size={18} /><span>Packages & Students</span>
          </div>
          <div className={`menu-item ${activeTab === 'verifications' ? 'active' : ''}`} onClick={() => { setActiveTab('verifications'); loadData(); }}>
            <CheckCircle size={18} />
            <span>Verifications</span>
            {pendingPayments.length > 0 && (
              <span className="badge badge-rejected" style={{ marginLeft: 'auto', padding: '2px 6px' }}>{pendingPayments.length}</span>
            )}
          </div>
          <div className={`menu-item ${activeTab === 'payments' ? 'active' : ''}`} onClick={() => { setActiveTab('payments'); loadData(); }}>
            <DollarSign size={18} /><span>Payments History</span>
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
          <div className="navbar-title">Welcome, <strong>Tutor {user.name}</strong></div>
          <div className="navbar-actions">
            <div className="user-profile-badge">
              <span>{user.email}</span>
              <span className="user-role-tag tutor-role-tag">Tutor</span>
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
                    <p>Total Students</p>
                    <h3>{totalStudents}</h3>
                  </div>
                  <div className="stats-icon"><Users size={24} /></div>
                </div>
                <div className="stats-card">
                  <div className="stats-info">
                    <p>Classes Today</p>
                    <h3>{classesToday}</h3>
                  </div>
                  <div className="stats-icon"><Clock size={24} style={{ color: 'var(--brand-secondary)' }} /></div>
                </div>
                <div className="stats-card">
                  <div className="stats-info">
                    <p>Total Earnings</p>
                    <h3>INR {totalEarnings}</h3>
                  </div>
                  <div className="stats-icon"><DollarSign size={24} style={{ color: 'var(--success)' }} /></div>
                </div>
                <div className="stats-card">
                  <div className="stats-info">
                    <p>Attendance Rate</p>
                    <h3>{attendanceRate}%</h3>
                  </div>
                  <div className="stats-icon"><CheckCircle size={24} style={{ color: 'var(--brand-primary)' }} /></div>
                </div>
              </div>

              {/* Pending Verifications Alert */}
              {pendingPayments.length > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '16px', backgroundColor: 'rgba(239,68,68,0.08)', border: '1px solid var(--danger)', borderRadius: 'var(--radius-md)', marginBottom: '32px' }}>
                  <ShieldAlert size={24} style={{ color: 'var(--danger)' }} />
                  <div style={{ flex: 1 }}>
                    <h4 style={{ color: 'var(--danger)' }}>Pending Payment Verification</h4>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>You have student payments waiting for verification. Verify in 5 hours before they expire.</p>
                  </div>
                  <button className="btn-primary" onClick={() => setActiveTab('verifications')} style={{ backgroundColor: 'var(--danger)' }}>
                    Verify Now
                  </button>
                </div>
              )}

              {/* Incoming Free Demo Requests */}
              {sessions.filter(s => s.status === 'Pending Tutor Approval').length > 0 && (
                <div style={{ marginBottom: '32px' }}>
                  <h3 style={{ marginBottom: '16px', color: 'var(--brand-secondary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <ShieldAlert size={20} /> Incoming Free Demo Requests
                  </h3>
                  <div className="table-container">
                    <table className="custom-table">
                      <thead>
                        <tr>
                          <th>Student</th>
                          <th>Subject</th>
                          <th>Requested Date</th>
                          <th>Requested Time</th>
                          <th>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {sessions.filter(s => s.status === 'Pending Tutor Approval').map(session => (
                          <tr key={session._id}>
                            <td><strong>{session.student?.name}</strong><br/><span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{session.student?.email}</span></td>
                            <td>{session.subject}</td>
                            <td>{new Date(session.date).toLocaleDateString()}</td>
                            <td>{session.startTime} - {session.endTime}</td>
                            <td>
                              <button 
                                className="btn-primary" 
                                onClick={async () => {
                                  try {
                                    await api.acceptDemo(session._id);
                                    alert('Demo request accepted successfully!');
                                    loadData();
                                  } catch (err) {
                                    alert(err.message || 'Error accepting demo request');
                                  }
                                }}
                                style={{ padding: '6px 12px', fontSize: '0.8rem', backgroundColor: 'var(--success)' }}
                              >
                                Accept & Schedule Demo
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Upcoming Classes */}
              <h3 style={{ marginBottom: '16px' }}>Today's Classes</h3>
              <div className="table-container">
                <table className="custom-table">
                  <thead>
                    <tr>
                      <th>Subject</th>
                      <th>Student</th>
                      <th>Time</th>
                      <th>Status</th>
                      <th>Attendance Override</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sessions.filter(s => new Date(s.date).toDateString() === new Date().toDateString()).length === 0 ? (
                      <tr>
                        <td colSpan="5" style={{ textAlign: 'center', padding: '32px' }}>No classes scheduled for today.</td>
                      </tr>
                    ) : (
                      sessions.filter(s => new Date(s.date).toDateString() === new Date().toDateString()).map(session => (
                        <tr key={session._id}>
                          <td><strong>{session.subject}</strong></td>
                          <td>{session.student?.name}</td>
                          <td>{session.startTime} - {session.endTime}</td>
                          <td>
                            <span className={`badge badge-${session.status.toLowerCase().replace(/ /g, '-')}`}>
                              {session.status}
                            </span>
                          </td>
                          <td>
                            {session.status === 'Scheduled' && (
                              <div style={{ display: 'flex', gap: '8px' }}>
                                <button className="btn-primary" onClick={() => handleCalendarAction('attendance-present', session)} style={{ padding: '4px 10px', fontSize: '0.75rem', backgroundColor: 'var(--success)' }}>
                                  Present
                                </button>
                                <button className="btn-secondary" onClick={() => handleCalendarAction('attendance-absent', session)} style={{ padding: '4px 10px', fontSize: '0.75rem', color: 'var(--danger)', borderColor: 'var(--danger)' }}>
                                  Absent
                                </button>
                              </div>
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
            <Calendar sessions={sessions} role="tutor" onAction={handleCalendarAction} />
          )}

          {activeTab === 'scheduler' && (
            <div style={{ maxWidth: '600px', backgroundColor: 'var(--bg-secondary)', padding: '32px', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)' }}>
              <h2 style={{ marginBottom: '16px' }}>Generate Student Schedule</h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '24px' }}>
                Setup a custom recurring class schedule. The engine automatically creates sessions between your start and end dates.
              </p>

              {scheduleError && <div style={{ color: 'var(--danger)', fontSize: '0.85rem', marginBottom: '16px' }}>{scheduleError}</div>}

              <form onSubmit={handleGenerateSchedule}>
                <div className="form-group">
                  <label>Select Student *</label>
                  <select className="form-select" value={selectedStudent} onChange={e => setSelectedStudent(e.target.value)} required>
                    <option value="">-- Choose Student --</option>
                    {studentsList.map(stu => (
                      <option key={stu._id} value={stu._id}>{stu.name} ({stu.email})</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Select Associated Package *</label>
                  <select className="form-select" value={selectedPackage} onChange={e => setSelectedPackage(e.target.value)} required>
                    <option value="">-- Choose Package --</option>
                    {tutorPackages.map(pkg => (
                      <option key={pkg._id} value={pkg._id}>{pkg.name} (INR {pkg.price} - {pkg.numberOfSessions} sessions)</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Subject *</label>
                  <input type="text" className="form-input" placeholder="e.g. Mathematics, Physics Grade 10" value={subject} onChange={e => setSubject(e.target.value)} required />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div className="form-group">
                    <label>Start Date *</label>
                    <input type="date" className="form-input" value={startDate} onChange={e => setStartDate(e.target.value)} required />
                  </div>
                  <div className="form-group">
                    <label>End Date *</label>
                    <input type="date" className="form-input" value={endDate} onChange={e => setEndDate(e.target.value)} required />
                  </div>
                </div>

                <div className="form-group">
                  <label>Days of the Week *</label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(day => {
                      const isSelected = selectedDays.includes(day);
                      return (
                        <button
                          key={day}
                          type="button"
                          className={isSelected ? 'btn-primary' : 'btn-secondary'}
                          onClick={() => handleDayToggle(day)}
                          style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                        >
                          {day.slice(0, 3)}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div className="form-group">
                    <label>Start Time *</label>
                    <input type="time" className="form-input" value={startTime} onChange={e => setStartTime(e.target.value)} required />
                  </div>
                  <div className="form-group">
                    <label>Duration (Hours) *</label>
                    <input type="number" step="0.5" className="form-input" value={durationHours} onChange={e => setDurationHours(e.target.value)} required />
                  </div>
                </div>

                <button type="submit" className="btn-primary" style={{ width: '100%', marginTop: '16px' }}>
                  Generate & Send Schedule
                </button>
              </form>
            </div>
          )}

          {activeTab === 'packages' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px' }}>
              {/* Create Package Panel */}
              <div style={{ backgroundColor: 'var(--bg-secondary)', padding: '24px', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)' }}>
                <h3>Create Learning Package</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '16px' }}>Setup packages students can purchase.</p>
                
                <form onSubmit={handleCreatePackage}>
                  <div className="form-group">
                    <label>Package Name</label>
                    <input type="text" className="form-input" placeholder="e.g. 10 Sessions Chemistry prep" value={packageName} onChange={e => setPackageName(e.target.value)} required />
                  </div>
                  <div className="form-group">
                    <label>Type</label>
                    <select className="form-select" value={packageType} onChange={e => setPackageType(e.target.value)}>
                      <option value="single">Single Class</option>
                      <option value="monthly">Monthly Subscription</option>
                      <option value="custom">Custom Bundle</option>
                    </select>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div className="form-group">
                      <label>Price (INR)</label>
                      <input type="number" className="form-input" value={packagePrice} onChange={e => setPackagePrice(e.target.value)} required />
                    </div>
                    <div className="form-group">
                      <label>Total Sessions</label>
                      <input type="number" className="form-input" value={packageSessions} onChange={e => setPackageSessions(e.target.value)} required />
                    </div>
                  </div>
                  <div className="form-group">
                    <label>Description</label>
                    <textarea className="form-textarea" rows="3" placeholder="Describe package details..." value={packageDesc} onChange={e => setPackageDesc(e.target.value)}></textarea>
                  </div>
                  <button type="submit" className="btn-primary" style={{ width: '100%' }}>Create Package</button>
                </form>
              </div>

              {/* Active Students List */}
              <div style={{ backgroundColor: 'var(--bg-secondary)', padding: '24px', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)' }}>
                <h3>Your Active Students</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '16px' }}>Students with active packages with you.</p>

                <div className="table-container" style={{ border: 'none', boxShadow: 'none' }}>
                  <table className="custom-table">
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Phone</th>
                      </tr>
                    </thead>
                    <tbody>
                      {studentsList.length === 0 ? (
                        <tr>
                          <td colSpan="3" style={{ textAlign: 'center', padding: '32px' }}>No students found yet. Verify payments to activate.</td>
                        </tr>
                      ) : (
                        studentsList.map(stu => (
                          <tr key={stu._id}>
                            <td><strong>{stu.name}</strong></td>
                            <td>{stu.email}</td>
                            <td>{stu.phone}</td>
                          </tr>
                        )))
                      }
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'payments' && (
            <div>
              {/* Active Student Packages Section */}
              <div style={{ backgroundColor: 'var(--bg-secondary)', padding: '24px', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)', marginBottom: '32px' }}>
                <h3>Active Student Packages & Cancellation</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '16px' }}>Manage current active student packages. Cancelling a package cancels all its upcoming scheduled sessions.</p>

                <div className="table-container" style={{ boxShadow: 'none' }}>
                  <table className="custom-table">
                    <thead>
                      <tr>
                        <th>Student</th>
                        <th>Package</th>
                        <th>Amount Paid</th>
                        <th>UTR Number</th>
                        <th>Remaining Sessions</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paymentHistory.filter(p => p.status === 'Verified' && p.remainingSessions > 0).length === 0 ? (
                        <tr>
                          <td colSpan="6" style={{ textAlign: 'center', padding: '24px' }}>No active student packages found.</td>
                        </tr>
                      ) : (
                        paymentHistory.filter(p => p.status === 'Verified' && p.remainingSessions > 0).map(payment => (
                          <tr key={payment._id}>
                            <td><strong>{payment.student?.name}</strong><br/><span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{payment.student?.email}</span></td>
                            <td>{payment.package?.name}</td>
                            <td>INR {payment.amount}</td>
                            <td><code>{payment.transactionId}</code></td>
                            <td>{payment.remainingSessions} / {payment.package?.numberOfSessions || 0}</td>
                            <td>
                              <button 
                                className="btn-secondary"
                                onClick={async () => {
                                  if (window.confirm(`Are you sure you want to cancel the package "${payment.package?.name}" for ${payment.student?.name}? All upcoming classes will be cancelled.`)) {
                                    try {
                                      await api.cancelStudentPackage(payment._id);
                                      alert('Package cancelled successfully.');
                                      loadData();
                                    } catch (err) {
                                      alert(err.message);
                                    }
                                  }
                                }}
                                style={{ color: 'var(--danger)', borderColor: 'var(--danger)', padding: '6px 12px', fontSize: '0.75rem' }}
                              >
                                Cancel Package
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Full Payment History Section */}
              <div style={{ backgroundColor: 'var(--bg-secondary)', padding: '24px', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)' }}>
                <h3>Complete Payment Transactions Log</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '16px' }}>History of all package payments submitted by students.</p>

                <div className="table-container" style={{ boxShadow: 'none' }}>
                  <table className="custom-table">
                    <thead>
                      <tr>
                        <th>UTR/Transaction ID</th>
                        <th>Student</th>
                        <th>Package</th>
                        <th>Price</th>
                        <th>Submitted Date</th>
                        <th>Status</th>
                        <th>Remarks</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paymentHistory.length === 0 ? (
                        <tr>
                          <td colSpan="7" style={{ textAlign: 'center', padding: '24px' }}>No payment transactions logged.</td>
                        </tr>
                      ) : (
                        paymentHistory.map(payment => (
                          <tr key={payment._id}>
                            <td><code>{payment.transactionId}</code></td>
                            <td><strong>{payment.student?.name}</strong><br/><span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{payment.student?.email}</span></td>
                            <td>{payment.package?.name}</td>
                            <td>INR {payment.amount}</td>
                            <td>{new Date(payment.submittedAt).toLocaleDateString()}</td>
                            <td>
                              <span className={`badge badge-${payment.status.toLowerCase().replace(/ /g, '-')}`}>
                                {payment.status}
                              </span>
                            </td>
                            <td style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{payment.remarks || '-'}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'verifications' && (
            <div>
              <h3>Pending Student Payment Verifications</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '16px' }}>
                Verify UPI transaction screenshots or UTR numbers and approve packages.
              </p>

              <div className="table-container">
                <table className="custom-table">
                  <thead>
                    <tr>
                      <th>Student</th>
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
                        <td colSpan="7" style={{ textAlign: 'center', padding: '32px' }}>No payments waiting for verification.</td>
                      </tr>
                    ) : (
                      pendingPayments.map(payment => (
                        <tr key={payment._id}>
                          <td><strong>{payment.student?.name}</strong><br/><span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{payment.student?.email}</span></td>
                          <td>{payment.package?.name}</td>
                          <td>INR {payment.amount}</td>
                          <td><code>{payment.transactionId}</code></td>
                          <td>
                            {payment.screenshot ? (
                              <button className="btn-secondary" onClick={() => setViewScreenshotUrl(payment.screenshot)} style={{ padding: '4px 8px', fontSize: '0.75rem' }}>
                                <Eye size={12} /> View Receipt
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
                                value={verificationRemarks}
                                onChange={e => setVerificationRemarks(e.target.value)}
                                style={{ padding: '6px', fontSize: '0.8rem' }}
                              />
                            ) : (
                              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>-</span>
                            )}
                          </td>
                          <td>
                            {activeVerifyId === payment._id ? (
                              <div style={{ display: 'flex', gap: '6px' }}>
                                <button className="btn-primary" onClick={() => handleVerifyPayment(payment._id, true)} style={{ padding: '6px', backgroundColor: 'var(--success)' }}>
                                  <Check size={14} />
                                </button>
                                <button className="btn-secondary" onClick={() => handleVerifyPayment(payment._id, false)} style={{ padding: '6px', color: 'var(--danger)', borderColor: 'var(--danger)' }}>
                                  <X size={14} />
                                </button>
                              </div>
                            ) : (
                              <button className="btn-primary" onClick={() => { setActiveVerifyId(payment._id); setVerificationRemarks(''); }} style={{ padding: '6px 12px', fontSize: '0.75rem' }}>
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
        </div>
      </div>

      {/* Image View Modal */}
      {viewScreenshotUrl && (
        <div className="modal-overlay" onClick={() => setViewScreenshotUrl(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '600px', textAlign: 'center' }}>
            <div className="modal-header">
              <h3>Payment Screenshot</h3>
              <button className="close-btn" onClick={() => setViewScreenshotUrl(null)}>✕</button>
            </div>
            <img src={viewScreenshotUrl} alt="Payment Receipt" style={{ maxWidth: '100%', maxHeight: '70vh', marginTop: '12px', borderRadius: 'var(--radius-sm)' }} />
          </div>
        </div>
      )}
    </div>
  );
}
