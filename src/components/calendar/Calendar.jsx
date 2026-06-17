import React, { useState } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Clock, User, Compass, CheckCircle, Video } from 'lucide-react';

export default function Calendar({ sessions = [], role, onAction }) {
  const [view, setView] = useState('month'); // month, week, day
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedEvent, setSelectedEvent] = useState(null);

  // Helper date logic
  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const totalDays = new Date(year, month + 1, 0).getDate();
    return { firstDay, totalDays };
  };

  const { firstDay, totalDays } = getDaysInMonth(currentDate);

  // Month navigation
  const prevPeriod = () => {
    const newDate = new Date(currentDate);
    if (view === 'month') newDate.setMonth(currentDate.getMonth() - 1);
    else if (view === 'week') newDate.setDate(currentDate.getDate() - 7);
    else newDate.setDate(currentDate.getDate() - 1);
    setCurrentDate(newDate);
  };

  const nextPeriod = () => {
    const newDate = new Date(currentDate);
    if (view === 'month') newDate.setMonth(currentDate.getMonth() + 1);
    else if (view === 'week') newDate.setDate(currentDate.getDate() + 7);
    else newDate.setDate(currentDate.getDate() + 1);
    setCurrentDate(newDate);
  };

  const getEventTagClass = (status) => {
    switch (status) {
      case 'Completed': return 'tag-completed';
      case 'Pending Student Approval':
      case 'Pending Tutor Approval': return 'tag-pending';
      case 'Rescheduled': return 'tag-rescheduled';
      case 'Cancelled': return 'tag-cancelled';
      case 'Scheduled':
      case 'Confirmed':
      case 'Upcoming':
      default: return 'tag-scheduled';
    }
  };

  // Render Month grid
  const renderMonthView = () => {
    const dayCells = [];
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    // Empty cells for first week offset
    for (let i = 0; i < firstDay; i++) {
      dayCells.push(<div key={`empty-${i}`} className="calendar-cell other-month"></div>);
    }

    // Days of month
    for (let day = 1; day <= totalDays; day++) {
      const cellDate = new Date(year, month, day);
      const isToday = new Date().toDateString() === cellDate.toDateString();

      // Find events on this day
      const dayEvents = sessions.filter(session => {
        const sDate = new Date(session.date);
        return sDate.getFullYear() === year && sDate.getMonth() === month && sDate.getDate() === day;
      });

      dayCells.push(
        <div key={`day-${day}`} className={`calendar-cell ${isToday ? 'today' : ''}`}>
          <span className="cell-number">{day}</span>
          <div className="calendar-events">
            {dayEvents.slice(0, 3).map((event, idx) => (
              <div
                key={event._id || idx}
                className={`event-tag ${getEventTagClass(event.status)}`}
                onClick={() => setSelectedEvent(event)}
              >
                {event.startTime} {event.subject}
              </div>
            ))}
            {dayEvents.length > 3 && (
              <div className="event-tag" style={{ backgroundColor: 'var(--text-muted)', fontSize: '0.65rem' }}>
                +{dayEvents.length - 3} more
              </div>
            )}
          </div>
        </div>
      );
    }

    return (
      <div className="calendar-grid-month">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
          <div key={d} className="calendar-day-header">{d}</div>
        ))}
        {dayCells}
      </div>
    );
  };

  // Render Week view
  const renderWeekView = () => {
    // Get start of week (Sunday)
    const startOfWeek = new Date(currentDate);
    startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());

    const days = [];
    const timeSlots = Array.from({ length: 14 }, (_, i) => i + 8); // 8 AM to 9 PM

    for (let i = 0; i < 7; i++) {
      const colDate = new Date(startOfWeek);
      colDate.setDate(startOfWeek.getDate() + i);
      days.push(colDate);
    }

    return (
      <div className="calendar-grid-week">
        <div className="week-time-col">
          <div className="week-day-header" style={{ height: '45px' }}>Time</div>
          {timeSlots.map(hour => (
            <div key={hour} className="time-slot-label">{hour}:00</div>
          ))}
        </div>

        {days.map((day, dIdx) => {
          const dayEvents = sessions.filter(s => new Date(s.date).toDateString() === day.toDateString());
          
          return (
            <div key={dIdx} className="week-day-col">
              <div className="week-day-header">
                <div>{day.toLocaleDateString('en-US', { weekday: 'short' })}</div>
                <div style={{ fontSize: '1.1rem', fontWeight: 'bold' }}>{day.getDate()}</div>
              </div>

              {timeSlots.map(hour => {
                const hourEvents = dayEvents.filter(s => {
                  const [h] = s.startTime.split(':').map(Number);
                  return h === hour;
                });

                return (
                  <div key={hour} className="week-time-slot">
                    {hourEvents.map((event, eIdx) => (
                      <div
                        key={event._id || eIdx}
                        className={`week-event-card ${getEventTagClass(event.status)}`}
                        onClick={() => setSelectedEvent(event)}
                      >
                        <div>{event.subject}</div>
                        <div style={{ fontSize: '0.65rem' }}>{event.startTime} - {event.endTime}</div>
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    );
  };

  // Render Day view
  const renderDayView = () => {
    const timeSlots = Array.from({ length: 14 }, (_, i) => i + 8); // 8 AM to 9 PM
    const dayEvents = sessions.filter(s => new Date(s.date).toDateString() === currentDate.toDateString());

    return (
      <div className="calendar-grid-week" style={{ gridTemplateColumns: '100px 1fr' }}>
        <div className="week-time-col">
          <div className="week-day-header" style={{ height: '45px' }}>Time</div>
          {timeSlots.map(hour => (
            <div key={hour} className="time-slot-label">{hour}:00</div>
          ))}
        </div>

        <div className="week-day-col" style={{ borderRight: 'none' }}>
          <div className="week-day-header" style={{ textAlign: 'left', paddingLeft: '24px' }}>
            {currentDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </div>

          {timeSlots.map(hour => {
            const hourEvents = dayEvents.filter(s => {
              const [h] = s.startTime.split(':').map(Number);
              return h === hour;
            });

            return (
              <div key={hour} className="week-time-slot" style={{ height: '70px', paddingLeft: '24px' }}>
                {hourEvents.map((event, eIdx) => (
                  <div
                    key={event._id || eIdx}
                    className={`week-event-card ${getEventTagClass(event.status)}`}
                    style={{ left: '24px', right: '24px', height: '55px', padding: '8px' }}
                    onClick={() => setSelectedEvent(event)}
                  >
                    <div style={{ fontSize: '0.9rem' }}>{event.subject}</div>
                    <div style={{ fontSize: '0.75rem', opacity: 0.9 }}>
                      {event.startTime} - {event.endTime} ({role === 'student' ? `Tutor: ${event.tutor?.name}` : `Student: ${event.student?.name}`})
                    </div>
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="calendar-container">
      <div className="calendar-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <CalendarIcon size={24} style={{ color: 'var(--brand-primary)' }} />
          <h2>
            {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </h2>
        </div>

        <div className="calendar-controls">
          <div className="calendar-views">
            <button className={`view-btn ${view === 'month' ? 'active' : ''}`} onClick={() => setView('month')}>Month</button>
            <button className={`view-btn ${view === 'week' ? 'active' : ''}`} onClick={() => setView('week')}>Week</button>
            <button className={`view-btn ${view === 'day' ? 'active' : ''}`} onClick={() => setView('day')}>Day</button>
          </div>

          <div style={{ display: 'flex', gap: '6px' }}>
            <button className="nav-btn" onClick={prevPeriod}><ChevronLeft size={16} /></button>
            <button className="nav-btn" onClick={() => setCurrentDate(new Date())} style={{ borderRadius: 'var(--radius-sm)', padding: '0 12px', fontSize: '0.8rem', width: 'auto' }}>Today</button>
            <button className="nav-btn" onClick={nextPeriod}><ChevronRight size={16} /></button>
          </div>
        </div>
      </div>

      <div style={{ minHeight: '400px' }}>
        {view === 'month' && renderMonthView()}
        {view === 'week' && renderWeekView()}
        {view === 'day' && renderDayView()}
      </div>

      {/* Event Details Modal */}
      {selectedEvent && (
        <div className="modal-overlay" onClick={() => setSelectedEvent(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Session Details</h3>
              <button className="close-btn" onClick={() => setSelectedEvent(null)}>✕</button>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'col', gap: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.2rem', fontWeight: 'bold' }}>
                <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: `var(--status-${selectedEvent.status.toLowerCase().replace(/ /g, '-')})` }}></div>
                {selectedEvent.subject}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', color: 'var(--text-secondary)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Clock size={16} />
                  <span>{new Date(selectedEvent.date).toDateString()} | {selectedEvent.startTime} - {selectedEvent.endTime}</span>
                </div>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <User size={16} />
                  <span>
                    {role === 'student' 
                      ? `Tutor: ${selectedEvent.tutor?.name || 'Tutor'}` 
                      : `Student: ${selectedEvent.student?.name || 'Student'}`
                    }
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Compass size={16} />
                  <span>Status: <strong style={{ color: `var(--status-${selectedEvent.status.toLowerCase().replace(/ /g, '-')})` }}>{selectedEvent.status}</strong></span>
                </div>
              </div>

              {/* Action Buttons inside Event Modal */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginTop: '10px' }}>
                {role === 'student' && selectedEvent.status === 'Scheduled' && (
                  <button 
                    className="btn-primary" 
                    onClick={() => {
                      onAction('join', selectedEvent._id);
                      setSelectedEvent(null);
                    }}
                    style={{ backgroundColor: 'var(--success)' }}
                  >
                    <Video size={16} /> Join Online Class
                  </button>
                )}

                {role === 'student' && selectedEvent.status === 'Pending Student Approval' && (
                  <button 
                    className="btn-primary" 
                    onClick={() => {
                      onAction('confirm', [selectedEvent._id]);
                      setSelectedEvent(null);
                    }}
                  >
                    <CheckCircle size={16} /> Accept Schedule
                  </button>
                )}

                {selectedEvent.status !== 'Completed' && selectedEvent.status !== 'Cancelled' && (
                  <button 
                    className="btn-secondary"
                    onClick={() => {
                      onAction('reschedule-request', selectedEvent);
                      setSelectedEvent(null);
                    }}
                  >
                    Reschedule Class
                  </button>
                )}

                {role === 'tutor' && selectedEvent.status === 'Pending Tutor Approval' && (
                  <button 
                    className="btn-primary" 
                    onClick={() => {
                      onAction('demo-accept', selectedEvent._id);
                      setSelectedEvent(null);
                    }}
                    style={{ backgroundColor: 'var(--success)', width: '100%', marginBottom: '10px' }}
                  >
                    Accept Demo Request
                  </button>
                )}

                {role === 'tutor' && selectedEvent.status === 'Scheduled' && (
                  <div style={{ display: 'flex', gap: '10px', width: '100%' }}>
                    <button 
                      className="btn-primary" 
                      onClick={() => {
                        onAction('attendance-present', selectedEvent);
                        setSelectedEvent(null);
                      }}
                      style={{ flex: 1, backgroundColor: 'var(--success)' }}
                    >
                      Mark Present
                    </button>
                    <button 
                      className="btn-secondary" 
                      onClick={() => {
                        onAction('attendance-absent', selectedEvent);
                        setSelectedEvent(null);
                      }}
                      style={{ flex: 1, borderColor: 'var(--danger)', color: 'var(--danger)' }}
                    >
                      Mark Absent
                    </button>
                  </div>
                )}

                {selectedEvent.status !== 'Completed' && selectedEvent.status !== 'Cancelled' && (
                  <button 
                    className="btn-secondary"
                    onClick={() => {
                      if (window.confirm('Are you sure you want to cancel this class? The session will be refunded to student package.')) {
                        onAction('cancel', selectedEvent._id);
                        setSelectedEvent(null);
                      }
                    }}
                    style={{ color: 'var(--danger)', borderColor: 'var(--danger)' }}
                  >
                    Cancel Class
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
