const express = require('express');
const { getAdminDashboardStats, getUsersList, deleteUser } = require('../controllers/adminController');
const { protect, authorize } = require('../middleware/authMiddleware');
const router = express.Router();

router.get('/stats', protect, authorize('admin'), getAdminDashboardStats);
router.get('/users', protect, authorize('admin'), getUsersList);
router.delete('/users/:id', protect, authorize('admin'), deleteUser);

module.exports = router;
