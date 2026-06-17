import React, { useState, useEffect } from 'react';
import { Compass, BookOpen, Clock, Calendar, CheckSquare, ShieldCheck, ArrowRight, UserCheck } from 'lucide-react';

export default function LandingPage({ onEnterApp }) {
  const [tutors, setTutors] = useState([]);

  useEffect(() => {
    // Fetch tutors for landing showcase (optional fallback if not logged in)
    const loadShowcaseTutors = async () => {
      try {
        const res = await fetch('http://localhost:5000/api/auth/register', { method: 'GET' }).catch(() => {});
        // Mock default premium showcase tutors
        setTutors([
          { name: 'Dr. Ramesh Sharma', subjects: ['Mathematics', 'Physics'], rate: '600/hr', qual: 'Ph.D. in Physics, IIT Delhi' },
          { name: 'Priya Iyer', subjects: ['Chemistry', 'Biology'], rate: '500/hr', qual: 'M.Sc. Biochemistry, Madras University' },
          { name: 'Amit Verma', subjects: ['English Literature', 'History'], rate: '450/hr', qual: 'MA in English Literature, DU' }
        ]);
      } catch (err) {}
    };
    loadShowcaseTutors();
  }, []);

  return (
    <div style={{ backgroundColor: 'var(--bg-primary)', minHeight: '100vh' }}>
      
      {/* Top Navbar */}
      <div className="top-navbar" style={{ position: 'sticky', top: 0, padding: '0 64px' }}>
        <div className="logo-text" style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>Mentorium EduHub</div>
        <div style={{ display: 'flex', gap: '20px' }}>
          <button className="btn-secondary" onClick={onEnterApp}>Dashboard Login</button>
          <button className="btn-primary" onClick={onEnterApp}>Join Now</button>
        </div>
      </div>

      {/* Hero Banner */}
      <div className="landing-hero">
        <h1>Connect with Verified Home & Online Tutors</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1.25rem', maxWidth: '800px', margin: '0 auto 32px auto', lineHeight: '1.6' }}>
          Mentorium EduHub is the complete operating system for private tutoring. Schedule classes, track verified escrow packages, auto-log attendance, and manage classes from one unified calendar interface.
        </p>
        <button className="btn-primary" style={{ padding: '16px 36px', fontSize: '1.1rem' }} onClick={onEnterApp}>
          Get Started as Student / Tutor <ArrowRight size={18} />
        </button>
      </div>

      {/* How It Works */}
      <div className="landing-section">
        <h2 className="section-title">How It Works</h2>
        <div className="features-grid">
          <div className="feature-item">
            <div className="stats-icon" style={{ backgroundColor: 'rgba(79, 70, 229, 0.1)', color: 'var(--brand-primary)' }}>
              <Compass size={24} />
            </div>
            <h3>1. Find Verified Tutors</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
              Students can search and filter through highly qualified tutors by subject, pricing, and mode (online/offline).
            </p>
          </div>
          <div className="feature-item">
            <div className="stats-icon" style={{ backgroundColor: 'rgba(14, 165, 233, 0.1)', color: 'var(--brand-secondary)' }}>
              <ShieldCheck size={24} />
            </div>
            <h3>2. Secure Escrow Package</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
              Select a session package and pay securely via UPI. Funds are held in escrow and verified within 5 hours to activate your classes.
            </p>
          </div>
          <div className="feature-item">
            <div className="stats-icon" style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', color: 'var(--success)' }}>
              <Calendar size={24} />
            </div>
            <h3>3. Recurring Schedule Engine</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
              Tutors create schedules spanning months. The platform generates all future classes automatically onto student and tutor calendars.
            </p>
          </div>
        </div>
      </div>

      {/* Showcase Tutors */}
      <div className="landing-section" style={{ borderTop: '1px solid var(--border-color)', borderBottom: '1px solid var(--border-color)' }}>
        <h2 className="section-title">Popular Tutors</h2>
        <div className="tutors-list-grid">
          {tutors.map((t, idx) => (
            <div key={idx} className="tutor-card-landing">
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <UserCheck size={20} style={{ color: 'var(--success)' }} />
                {t.name}
              </h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{t.qual}</p>
              <div style={{ display: 'flex', gap: '8px' }}>
                {t.subjects.map(s => (
                  <span key={s} style={{ backgroundColor: 'var(--bg-primary)', padding: '2px 8px', borderRadius: '4px', fontSize: '0.75rem' }}>{s}</span>
                ))}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px' }}>
                <span style={{ fontSize: '0.9rem', fontWeight: 'bold', color: 'var(--brand-primary)' }}>INR {t.rate}</span>
                <button className="btn-secondary" style={{ padding: '6px 12px', fontSize: '0.8rem' }} onClick={onEnterApp}>View Profile</button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* FAQ Section */}
      <div className="landing-section">
        <h2 className="section-title">Frequently Asked Questions</h2>
        <div className="faq-grid">
          <div className="faq-item">
            <h4 style={{ marginBottom: '8px' }}>How does the payment flow work?</h4>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
              Students purchase tutoring session bundles. The payment page displays a UPI QR Code. The student makes an external payment and submits their Transaction ID (UTR Number). The tutor or admin reviews the receipt within 5 hours to unlock the schedule.
            </p>
          </div>
          <div className="faq-item">
            <h4 style={{ marginBottom: '8px' }}>What happens if a payment is not verified within 5 hours?</h4>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
              Unverified payments automatically expire after 5 hours and are set to "Rejected" status. The student will receive a notification to resubmit the transaction details. During this time, the schedule remains locked.
            </p>
          </div>
          <div className="faq-item">
            <h4 style={{ marginBottom: '8px' }}>How are schedules generated?</h4>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
              Tutors select a start date, end date, teaching days (e.g. Mon/Wed/Fri), time, and duration. The platform automatically generates every class instance for the entire date range, avoiding any double-booking conflicts.
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div style={{ backgroundColor: 'var(--bg-secondary)', padding: '40px 64px', borderTop: '1px solid var(--border-color)', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
        <p>© 2026 Mentorium EduHub. All Rights Reserved. Built for Students and Tutors.</p>
      </div>

    </div>
  );
}
