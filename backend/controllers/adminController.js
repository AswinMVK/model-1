const User = require('../models/User');
const Payment = require('../models/Payment');
const Session = require('../models/Session');
const Tutor = require('../models/Tutor');
const Student = require('../models/Student');

const getAdminDashboardStats = async (req, res) => {
  try {
    const totalTutors = await User.countDocuments({ role: 'tutor' });
    const totalStudents = await User.countDocuments({ role: 'student' });
    const pendingPayments = await Payment.countDocuments({ status: { $in: ['Pending Verification', 'Package Accepted by Student'] } });
    const activeClasses = await Session.countDocuments({ status: { $in: ['Scheduled', 'Confirmed', 'Live'] } });
    
    // Sum all verified payments
    const verifiedPaymentsSum = await Payment.aggregate([
      { $match: { status: 'Verified' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    const totalEarnings = verifiedPaymentsSum[0]?.total || 0;

    // Monthly earnings breakdown (last 6 months)
    const monthlyStats = await Payment.aggregate([
      { $match: { status: 'Verified' } },
      {
        $group: {
          _id: {
            year: { $year: '$submittedAt' },
            month: { $month: '$submittedAt' }
          },
          earnings: { $sum: '$amount' }
        }
      },
      { $sort: { '_id.year': -1, '_id.month': -1 } },
      { $limit: 6 }
    ]);

    res.json({
      totalTutors,
      totalStudents,
      pendingPayments,
      activeClasses,
      totalEarnings,
      monthlyStats
    });
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving admin stats', error: error.message });
  }
};

const getUsersList = async (req, res) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving users', error: error.message });
  }
};

const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.role === 'admin') {
      return res.status(400).json({ message: 'Cannot delete admin accounts' });
    }

    await User.findByIdAndDelete(req.params.id);

    if (user.role === 'tutor') {
      await Tutor.findOneAndDelete({ user: req.params.id });
    } else if (user.role === 'student') {
      await Student.findOneAndDelete({ user: req.params.id });
    }

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting user', error: error.message });
  }
};

module.exports = { getAdminDashboardStats, getUsersList, deleteUser };
