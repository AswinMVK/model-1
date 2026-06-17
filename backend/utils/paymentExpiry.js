const Payment = require('../models/Payment');
const Notification = require('../models/Notification');

const checkExpiredPayments = async () => {
  console.log('Running automatic 5-hour payment expiry check...');
  try {
    const fiveHoursAgo = new Date();
    fiveHoursAgo.setHours(fiveHoursAgo.getHours() - 5);

    // Find payments submitted > 5 hours ago that are still pending
    const expiredPayments = await Payment.find({
      status: { $in: ['Pending Verification', 'Package Accepted by Student'] },
      submittedAt: { $lte: fiveHoursAgo }
    }).populate('student', 'name');

    if (expiredPayments.length === 0) {
      console.log('No expired payments found.');
      return;
    }

    console.log(`Found ${expiredPayments.length} expired payments. Rejecting...`);

    for (let payment of expiredPayments) {
      payment.status = 'Rejected';
      payment.remarks = 'Expired (Unverified for more than 5 hours)';
      await payment.save();

      // Create notification for student
      await Notification.create({
        user: payment.student._id,
        title: 'Payment Request Expired',
        message: 'Your payment request has expired and requires resubmission.',
        type: 'payment'
      });

      console.log(`Payment UTR ${payment.transactionId} for student ${payment.student.name} marked Expired/Rejected.`);
    }
  } catch (error) {
    console.error('Error running payment expiry check:', error.message);
  }
};

module.exports = { checkExpiredPayments };
