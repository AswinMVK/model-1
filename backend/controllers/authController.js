const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Tutor = require('../models/Tutor');
const Student = require('../models/Student');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'mentorium_jwt_secret_key_12345', {
    expiresIn: '30d',
  });
};

const registerUser = async (req, res) => {
  const { name, email, phone, password, role, qualifications, subjects, experience, hourlyRate, teachingMode } = req.body;

  try {
    const userExists = await User.findOne({ email });

    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const user = await User.create({
      name,
      email,
      phone,
      password,
      role
    });

    if (user) {
      if (role === 'tutor') {
        await Tutor.create({
          user: user._id,
          qualifications: qualifications || 'N/A',
          subjects: subjects || [],
          experience: experience || 0,
          hourlyRate: hourlyRate || 0,
          teachingMode: teachingMode || 'online',
          availability: []
        });
      } else if (role === 'student') {
        await Student.create({
          user: user._id,
          bio: '',
          interests: []
        });
      }

      res.status(201).json({
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        token: generateToken(user._id),
      });
    } else {
      res.status(400).json({ message: 'Invalid user data' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error during registration', error: error.message });
  }
};

const authUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    // Auto-create admin if logging in with the specific admin credentials and no admin exists
    if (email === 'AswinMVK' && password === 'IamASWIN100%') {
      let adminUser = await User.findOne({ role: 'admin' });
      if (!adminUser) {
        adminUser = await User.create({
          name: 'Aswin MVK',
          email: 'AswinMVK',
          phone: '+91 99999 99999',
          password: 'IamASWIN100%',
          role: 'admin'
        });
      }
    }

    const user = await User.findOne({ email });

    if (user && (await user.matchPassword(password))) {
      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        token: generateToken(user._id),
      });
    } else {
      res.status(401).json({ message: 'Invalid email/username or password' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error during login', error: error.message });
  }
};

const getStudents = async (req, res) => {
  try {
    const students = await User.find({ role: 'student' }).select('name email phone');
    res.json(students);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching students', error: error.message });
  }
};

const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    let profileData = {};
    if (user.role === 'tutor') {
      profileData = await Tutor.findOne({ user: user._id });
    } else if (user.role === 'student') {
      profileData = await Student.findOne({ user: user._id });
    }

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      profile: profileData
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error fetching profile', error: error.message });
  }
};

module.exports = { registerUser, authUser, getUserProfile, getStudents };
