const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

const User = require('./models/User');
const Student = require('./models/Student');
const Tutor = require('./models/Tutor');
const Package = require('./models/Package');
const Payment = require('./models/Payment');
const Session = require('./models/Session');
const Attendance = require('./models/Attendance');
const Notification = require('./models/Notification');

const clearDb = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/mentorium';
    console.log('Connecting to database:', mongoUri);
    await mongoose.connect(mongoUri);

    console.log('Clearing non-admin users...');
    const deleteUsersResult = await User.deleteMany({ role: { $ne: 'admin' } });
    console.log(`Deleted ${deleteUsersResult.deletedCount} non-admin users.`);

    console.log('Clearing student profiles...');
    const deleteStudentsResult = await Student.deleteMany({});
    console.log(`Deleted ${deleteStudentsResult.deletedCount} student profiles.`);

    console.log('Clearing tutor profiles...');
    const deleteTutorsResult = await Tutor.deleteMany({});
    console.log(`Deleted ${deleteTutorsResult.deletedCount} tutor profiles.`);

    console.log('Clearing packages...');
    const deletePackagesResult = await Package.deleteMany({});
    console.log(`Deleted ${deletePackagesResult.deletedCount} packages.`);

    console.log('Clearing payments...');
    const deletePaymentsResult = await Payment.deleteMany({});
    console.log(`Deleted ${deletePaymentsResult.deletedCount} payments.`);

    console.log('Clearing sessions...');
    const deleteSessionsResult = await Session.deleteMany({});
    console.log(`Deleted ${deleteSessionsResult.deletedCount} sessions.`);

    console.log('Clearing attendance...');
    const deleteAttendanceResult = await Attendance.deleteMany({});
    console.log(`Deleted ${deleteAttendanceResult.deletedCount} attendance records.`);

    console.log('Clearing notifications...');
    const deleteNotificationsResult = await Notification.deleteMany({});
    console.log(`Deleted ${deleteNotificationsResult.deletedCount} notifications.`);

    console.log('Database cleared successfully! Only admin accounts are retained.');
    process.exit(0);
  } catch (error) {
    console.error('Error clearing database:', error);
    process.exit(1);
  }
};

clearDb();
