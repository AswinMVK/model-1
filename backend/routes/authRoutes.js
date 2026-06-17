const express = require('express');
const { registerUser, authUser, getUserProfile, getStudents } = require('../controllers/authController');
const { protect, authorize } = require('../middleware/authMiddleware');
const router = express.Router();

router.post('/register', protect, authorize('admin'), registerUser);
router.post('/login', authUser);
router.get('/profile', protect, getUserProfile);
router.get('/students', protect, getStudents);

module.exports = router;
