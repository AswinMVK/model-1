// api.js - Frontend API Service wrapper

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const getHeaders = () => {
  const token = localStorage.getItem('mentorium_token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
  };
};

const handleResponse = async (response) => {
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Something went wrong');
  }
  return data;
};

export const api = {
  // Auth
  login: async (email, password) => {
    const res = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    return handleResponse(res);
  },

  register: async (formData) => {
    const res = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(formData)
    });
    return handleResponse(res);
  },

  deleteUser: async (id) => {
    const res = await fetch(`${BASE_URL}/admin/users/${id}`, {
      method: 'DELETE',
      headers: getHeaders()
    });
    return handleResponse(res);
  },

  getProfile: async () => {
    const res = await fetch(`${BASE_URL}/auth/profile`, {
      headers: getHeaders()
    });
    return handleResponse(res);
  },

  getStudents: async () => {
    const res = await fetch(`${BASE_URL}/auth/students`, {
      headers: getHeaders()
    });
    return handleResponse(res);
  },

  // Tutors
  getTutors: async () => {
    const res = await fetch(`${BASE_URL}/tutors`, {
      headers: getHeaders()
    });
    return handleResponse(res);
  },

  getTutorDetails: async (id) => {
    const res = await fetch(`${BASE_URL}/tutors/${id}`, {
      headers: getHeaders()
    });
    return handleResponse(res);
  },

  updateAvailability: async (availability) => {
    const res = await fetch(`${BASE_URL}/tutors/availability`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify({ availability })
    });
    return handleResponse(res);
  },

  createPackage: async (packageData) => {
    const res = await fetch(`${BASE_URL}/tutors/packages`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(packageData)
    });
    return handleResponse(res);
  },

  getTutorPackages: async (tutorId) => {
    const res = await fetch(`${BASE_URL}/tutors/${tutorId}/packages`, {
      headers: getHeaders()
    });
    return handleResponse(res);
  },

  // Payments
  submitPayment: async (paymentData) => {
    const res = await fetch(`${BASE_URL}/payments/submit`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(paymentData)
    });
    return handleResponse(res);
  },

  getPendingPayments: async () => {
    const res = await fetch(`${BASE_URL}/payments/pending`, {
      headers: getHeaders()
    });
    return handleResponse(res);
  },

  getPaymentHistory: async () => {
    const res = await fetch(`${BASE_URL}/payments/history`, {
      headers: getHeaders()
    });
    return handleResponse(res);
  },

  verifyPayment: async (id, remarks) => {
    const res = await fetch(`${BASE_URL}/payments/${id}/verify`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify({ remarks })
    });
    return handleResponse(res);
  },

  rejectPayment: async (id, remarks) => {
    const res = await fetch(`${BASE_URL}/payments/${id}/reject`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify({ remarks })
    });
    return handleResponse(res);
  },

  cancelStudentPackage: async (id) => {
    const res = await fetch(`${BASE_URL}/payments/${id}/cancel-package`, {
      method: 'PUT',
      headers: getHeaders()
    });
    return handleResponse(res);
  },

  // Sessions
  createSchedule: async (scheduleData) => {
    const res = await fetch(`${BASE_URL}/sessions/schedule`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(scheduleData)
    });
    return handleResponse(res);
  },

  confirmSchedule: async (sessionIds) => {
    const res = await fetch(`${BASE_URL}/sessions/confirm`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ sessionIds })
    });
    return handleResponse(res);
  },

  getSessions: async () => {
    const res = await fetch(`${BASE_URL}/sessions`, {
      headers: getHeaders()
    });
    return handleResponse(res);
  },

  requestReschedule: async (rescheduleData) => {
    const res = await fetch(`${BASE_URL}/sessions/reschedule`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(rescheduleData)
    });
    return handleResponse(res);
  },

  approveReschedule: async (sessionId, approve) => {
    const res = await fetch(`${BASE_URL}/sessions/${sessionId}/reschedule-approve`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify({ approve })
    });
    return handleResponse(res);
  },

  joinSession: async (sessionId) => {
    const res = await fetch(`${BASE_URL}/sessions/${sessionId}/join`, {
      method: 'PUT',
      headers: getHeaders()
    });
    return handleResponse(res);
  },

  markAttendance: async (sessionId, attendanceData) => {
    const res = await fetch(`${BASE_URL}/sessions/${sessionId}/attendance`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(attendanceData)
    });
    return handleResponse(res);
  },

  getAttendanceRecords: async () => {
    const res = await fetch(`${BASE_URL}/sessions/attendance`, {
      headers: getHeaders()
    });
    return handleResponse(res);
  },

  cancelSession: async (sessionId) => {
    const res = await fetch(`${BASE_URL}/sessions/${sessionId}/cancel`, {
      method: 'PUT',
      headers: getHeaders()
    });
    return handleResponse(res);
  },

  requestDemo: async (demoData) => {
    const res = await fetch(`${BASE_URL}/sessions/demo-request`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(demoData)
    });
    return handleResponse(res);
  },

  acceptDemo: async (sessionId) => {
    const res = await fetch(`${BASE_URL}/sessions/${sessionId}/demo-accept`, {
      method: 'PUT',
      headers: getHeaders()
    });
    return handleResponse(res);
  },

  // Notifications
  getNotifications: async () => {
    const res = await fetch(`${BASE_URL}/notifications`, {
      headers: getHeaders()
    });
    return handleResponse(res);
  },

  markNotificationsAsRead: async () => {
    const res = await fetch(`${BASE_URL}/notifications/read`, {
      method: 'PUT',
      headers: getHeaders()
    });
    return handleResponse(res);
  },

  // Admin
  getAdminStats: async () => {
    const res = await fetch(`${BASE_URL}/admin/stats`, {
      headers: getHeaders()
    });
    return handleResponse(res);
  },

  getUsersList: async () => {
    const res = await fetch(`${BASE_URL}/admin/users`, {
      headers: getHeaders()
    });
    return handleResponse(res);
  }
};
