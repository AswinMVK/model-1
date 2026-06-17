const Payment = require('../models/Payment');
const Package = require('../models/Package');
const User = require('../models/User');
const Notification = require('../models/Notification');
const { sendPaymentEmail } = require('../utils/sendEmail');

// Submit manual payment request
const submitPayment = async (req, res) => {
  const { tutorId, packageId, amount, transactionId, screenshot } = req.body;

  try {
    // Check if active payment with same UTR already exists
    const duplicate = await Payment.findOne({
      transactionId,
      status: { $in: ['Pending Verification', 'Package Accepted by Student', 'Verified'] }
    });

    if (duplicate) {
      return res.status(400).json({ message: 'A payment with this Transaction ID/UTR is already pending or verified.' });
    }

    const pkg = await Package.findById(packageId);
    if (!pkg) {
      return res.status(404).json({ message: 'Selected package not found' });
    }

    const tutor = await User.findById(tutorId);
    const student = await User.findById(req.user._id);

    if (!tutor || !student) {
      return res.status(404).json({ message: 'Tutor or Student user not found' });
    }

    const payment = await Payment.create({
      student: req.user._id,
      tutor: tutorId,
      package: packageId,
      amount,
      transactionId,
      screenshot,
      status: 'Package Accepted by Student',
      remainingSessions: pkg.numberOfSessions
    });

    // Send email notification
    await sendPaymentEmail(payment, student, tutor, pkg);

    // Create notifications
    await Notification.create({
      user: tutorId,
      title: 'New Payment Submitted',
      message: `Student ${student.name} submitted a payment of INR ${amount} for package ${pkg.name}. UTR: ${transactionId}`,
      type: 'payment'
    });

    // Create admin notification
    const admins = await User.find({ role: 'admin' });
    for (let admin of admins) {
      await Notification.create({
        user: admin._id,
        title: 'New Payment Pending Verification',
        message: `Student ${student.name} submitted UTR: ${transactionId} for package ${pkg.name}.`,
        type: 'payment'
      });
    }

    res.status(201).json({ message: 'Payment request submitted successfully', payment });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error submitting payment', error: error.message });
  }
};

// Get pending verification payments
const getPendingPayments = async (req, res) => {
  try {
    let query = { status: { $in: ['Pending Verification', 'Package Accepted by Student'] } };

    // Tutors can only see their own pending payments
    if (req.user.role === 'tutor') {
      query.tutor = req.user._id;
    }

    const payments = await Payment.find(query)
      .populate('student', 'name email phone')
      .populate('tutor', 'name email phone')
      .populate('package', 'name type price numberOfSessions');

    res.json(payments);
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving pending payments', error: error.message });
  }
};

// Get all payments (history)
const getPaymentHistory = async (req, res) => {
  try {
    let query = {};
    if (req.user.role === 'student') {
      query.student = req.user._id;
    } else if (req.user.role === 'tutor') {
      query.tutor = req.user._id;
    }

    const payments = await Payment.find(query)
      .populate('student', 'name email phone')
      .populate('tutor', 'name email phone')
      .populate('package', 'name type price numberOfSessions')
      .sort({ submittedAt: -1 });

    res.json(payments);
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving payment history', error: error.message });
  }
};

// Verify payment
const verifyPayment = async (req, res) => {
  const { remarks } = req.body;
  try {
    const payment = await Payment.findById(req.params.id)
      .populate('student', 'name email')
      .populate('package', 'name');

    if (!payment) {
      return res.status(404).json({ message: 'Payment record not found' });
    }

    // Only Admin or the designated Tutor can verify
    if (req.user.role !== 'admin' && payment.tutor.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to verify this payment' });
    }

    payment.status = 'Verified';
    payment.verifiedAt = Date.now();
    payment.remarks = remarks || 'Verified by ' + req.user.role;
    await payment.save();

    // Link unpaid sessions to this verified payment
    const Session = require('../models/Session');
    const Attendance = require('../models/Attendance');

    const unpaidSessions = await Session.find({
      student: payment.student._id,
      tutor: payment.tutor._id,
      package: payment.package._id,
      payment: null
    }).sort({ date: 1 });

    let linkedCount = 0;
    for (let session of unpaidSessions) {
      if (payment.remainingSessions > 0) {
        session.payment = payment._id;
        session.status = 'Scheduled'; // Automatically activate prepaid sessions
        await session.save();

        payment.remainingSessions -= 1;
        linkedCount++;

        // Create initial attendance row
        await Attendance.create({
          session: session._id,
          student: payment.student._id,
          status: 'Absent',
          updatedBy: 'auto'
        });
      }
    }

    if (linkedCount > 0) {
      await payment.save();
    }

    // Notify student
    await Notification.create({
      user: payment.student._id,
      title: 'Payment Approved',
      message: `Your payment of INR ${payment.amount} for package ${payment.package.name} has been verified. ${linkedCount > 0 ? `${linkedCount} scheduled sessions have been unlocked and activated!` : 'Your schedule is unlocked!'}`,
      type: 'payment'
    });

    res.json({ message: 'Payment verified successfully', payment, linkedSessionsCount: linkedCount });
  } catch (error) {
    res.status(500).json({ message: 'Error verifying payment', error: error.message });
  }
};

// Reject payment
const rejectPayment = async (req, res) => {
  const { remarks } = req.body;
  try {
    const payment = await Payment.findById(req.params.id)
      .populate('student', 'name email')
      .populate('package', 'name');

    if (!payment) {
      return res.status(404).json({ message: 'Payment record not found' });
    }

    if (req.user.role !== 'admin' && payment.tutor.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to reject this payment' });
    }

    payment.status = 'Rejected';
    payment.remarks = remarks || 'Rejected by ' + req.user.role;
    await payment.save();

    // Notify student
    await Notification.create({
      user: payment.student._id,
      title: 'Payment Rejected',
      message: `Your payment of INR ${payment.amount} for package ${payment.package.name} was rejected. Reason: ${payment.remarks}`,
      type: 'payment'
    });

    res.json({ message: 'Payment rejected successfully', payment });
  } catch (error) {
    res.status(500).json({ message: 'Error rejecting payment', error: error.message });
  }
};

// Cancel/Remove a student's active verified package
const cancelStudentPackage = async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id)
      .populate('student', 'name')
      .populate('package', 'name');

    if (!payment) {
      return res.status(404).json({ message: 'Payment/Package record not found' });
    }

    // Authorization: Admin or the designated Tutor
    if (req.user.role !== 'admin' && payment.tutor.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to modify this package' });
    }

    // Update status to Refunded/Cancelled
    payment.status = 'Refunded';
    payment.remainingSessions = 0;
    await payment.save();

    // Cancel all upcoming sessions linked to this payment
    const Session = require('../models/Session');
    const cancelledSessions = await Session.updateMany(
      {
        payment: payment._id,
        status: { $in: ['Scheduled', 'Pending Student Approval', 'Confirmed', 'Upcoming'] }
      },
      { status: 'Cancelled' }
    );

    // Notify student
    await Notification.create({
      user: payment.student._id,
      title: 'Package Cancelled',
      message: `Your active package "${payment.package.name}" has been cancelled/removed by the ${req.user.role}. All associated upcoming sessions have been cancelled.`,
      type: 'payment'
    });

    res.json({
      message: 'Package cancelled successfully and upcoming classes cancelled.',
      payment,
      cancelledSessionsCount: cancelledSessions.modifiedCount
    });
  } catch (error) {
    res.status(500).json({ message: 'Error cancelling student package', error: error.message });
  }
};

module.exports = {
  submitPayment,
  getPendingPayments,
  getPaymentHistory,
  verifyPayment,
  rejectPayment,
  cancelStudentPackage
};
