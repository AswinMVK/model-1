const express = require('express');
const {
  submitPayment,
  getPendingPayments,
  getPaymentHistory,
  verifyPayment,
  rejectPayment,
  cancelStudentPackage
} = require('../controllers/paymentController');
const { protect, authorize } = require('../middleware/authMiddleware');
const router = express.Router();

router.post('/submit', protect, authorize('student'), submitPayment);
router.get('/pending', protect, authorize('tutor', 'admin'), getPendingPayments);
router.get('/history', protect, getPaymentHistory);
router.put('/:id/verify', protect, authorize('tutor', 'admin'), verifyPayment);
router.put('/:id/reject', protect, authorize('tutor', 'admin'), rejectPayment);
router.put('/:id/cancel-package', protect, authorize('tutor', 'admin'), cancelStudentPackage);

module.exports = router;
