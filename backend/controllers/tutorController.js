const User = require('../models/User');
const Tutor = require('../models/Tutor');
const Package = require('../models/Package');

// Get all tutors
const getAllTutors = async (req, res) => {
  try {
    const tutors = await Tutor.find().populate('user', 'name email phone');
    res.json(tutors);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching tutors', error: error.message });
  }
};

// Get single tutor by user ID
const getTutorById = async (req, res) => {
  try {
    const tutor = await Tutor.findOne({ user: req.params.id }).populate('user', 'name email phone');
    if (!tutor) {
      return res.status(404).json({ message: 'Tutor not found' });
    }
    res.json(tutor);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching tutor details', error: error.message });
  }
};

// Update tutor availability
const updateAvailability = async (req, res) => {
  try {
    const { availability } = req.body;
    let tutor = await Tutor.findOne({ user: req.user._id });
    if (!tutor) {
      return res.status(404).json({ message: 'Tutor profile not found' });
    }

    tutor.availability = availability;
    await tutor.save();
    res.json({ message: 'Availability updated successfully', availability: tutor.availability });
  } catch (error) {
    res.status(500).json({ message: 'Error updating availability', error: error.message });
  }
};

// Create a package
const createPackage = async (req, res) => {
  try {
    const { name, type, price, numberOfSessions, description } = req.body;
    const pkg = await Package.create({
      tutor: req.user._id,
      name,
      type,
      price,
      numberOfSessions,
      description
    });
    res.status(201).json(pkg);
  } catch (error) {
    res.status(500).json({ message: 'Error creating package', error: error.message });
  }
};

// Get tutor's packages
const getTutorPackages = async (req, res) => {
  try {
    const tutorId = req.params.tutorId || req.user._id;
    const packages = await Package.find({ tutor: tutorId });
    res.json(packages);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching packages', error: error.message });
  }
};

module.exports = {
  getAllTutors,
  getTutorById,
  updateAvailability,
  createPackage,
  getTutorPackages
};
