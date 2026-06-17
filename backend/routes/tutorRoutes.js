const express = require('express');
const {
  getAllTutors,
  getTutorById,
  updateAvailability,
  createPackage,
  getTutorPackages
} = require('../controllers/tutorController');
const { protect, authorize } = require('../middleware/authMiddleware');
const router = express.Router();

router.get('/', protect, getAllTutors);
router.get('/:id', protect, getTutorById);
router.put('/availability', protect, authorize('tutor'), updateAvailability);
router.post('/packages', protect, authorize('tutor'), createPackage);
router.get('/:tutorId/packages', protect, getTutorPackages);

module.exports = router;
