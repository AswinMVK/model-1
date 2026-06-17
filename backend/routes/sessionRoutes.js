const express = require('express');
const {
  createSchedule,
  confirmSchedule,
  getSessions,
  requestReschedule,
  approveReschedule,
  joinSession,
  markAttendance,
  getAttendanceRecords,
  cancelSession,
  requestDemoClass,
  acceptDemoClass
} = require('../controllers/sessionController');
const { protect, authorize } = require('../middleware/authMiddleware');
const router = express.Router();

router.post('/schedule', protect, authorize('tutor'), createSchedule);
router.post('/confirm', protect, authorize('student'), confirmSchedule);
router.post('/demo-request', protect, authorize('student'), requestDemoClass);
router.put('/:id/demo-accept', protect, authorize('tutor'), acceptDemoClass);
router.get('/', protect, getSessions);
router.post('/reschedule', protect, requestReschedule);
router.put('/:id/reschedule-approve', protect, approveReschedule);
router.put('/:id/join', protect, authorize('student'), joinSession);
router.put('/:id/attendance', protect, authorize('tutor', 'admin'), markAttendance);
router.get('/attendance', protect, getAttendanceRecords);
router.put('/:id/cancel', protect, cancelSession);

module.exports = router;
