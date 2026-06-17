const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');
const Tutor = require('./models/Tutor');
const Student = require('./models/Student');
const Package = require('./models/Package');
const Payment = require('./models/Payment');
const Session = require('./models/Session');
const Attendance = require('./models/Attendance');
const Notification = require('./models/Notification');

// Load environment variables
dotenv.config();

const seedData = async () => {
  try {
    console.log('Connecting to database for seeding...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/mentorium');
    console.log('Connected.');

    // Clear existing collections
    console.log('Clearing old collections...');
    await User.deleteMany({});
    await Tutor.deleteMany({});
    await Student.deleteMany({});
    await Package.deleteMany({});
    await Payment.deleteMany({});
    await Session.deleteMany({});
    await Attendance.deleteMany({});
    await Notification.deleteMany({});
    console.log('Database cleared.');

    // 1. Create Admin
    console.log('Seeding Admin account...');
    const adminUser = await User.create({
      name: 'Aswin MVK',
      email: 'AswinMVK',
      phone: '+91 99999 99999',
      password: 'IamASWIN100%',
      role: 'admin'
    });

    // 2. Create Tutors
    console.log('Seeding Tutors...');
    const tutor1User = await User.create({
      name: 'Priya Sharma',
      email: 'priya.tutor@mentorium.com',
      phone: '+91 98888 88888',
      password: 'password123',
      role: 'tutor'
    });

    const tutor1Profile = await Tutor.create({
      user: tutor1User._id,
      qualifications: 'M.Sc in Applied Mathematics, Delhi University',
      subjects: ['Mathematics', 'Physics', 'Algebra', 'Calculus'],
      experience: 6,
      hourlyRate: 500,
      teachingMode: 'online',
      availability: [
        { day: 'Monday', startTime: '09:00', endTime: '18:00' },
        { day: 'Wednesday', startTime: '09:00', endTime: '18:00' },
        { day: 'Friday', startTime: '09:00', endTime: '18:00' }
      ]
    });

    const tutor2User = await User.create({
      name: 'Amit Verma',
      email: 'amit.tutor@mentorium.com',
      phone: '+91 97777 77777',
      password: 'password123',
      role: 'tutor'
    });

    const tutor2Profile = await Tutor.create({
      user: tutor2User._id,
      qualifications: 'MA in English Literature, Jawaharlal Nehru University',
      subjects: ['English Literature', 'History', 'Creative Writing'],
      experience: 4,
      hourlyRate: 400,
      teachingMode: 'both',
      availability: [
        { day: 'Tuesday', startTime: '10:00', endTime: '19:00' },
        { day: 'Thursday', startTime: '10:00', endTime: '19:00' }
      ]
    });

    // 3. Create Students
    console.log('Seeding Students...');
    const studentUser = await User.create({
      name: 'Aswin Kumar',
      email: 'aswin.student@mentorium.com',
      phone: '+91 96666 96666',
      password: 'password123',
      role: 'student'
    });

    const studentProfile = await Student.create({
      user: studentUser._id,
      bio: 'High school student preparing for university entrance exams.',
      interests: ['Calculus', 'Physics']
    });

    // 4. Create Packages for Tutor Priya
    console.log('Seeding Packages...');
    const demoPkg = await Package.create({
      tutor: tutor1User._id,
      name: 'Free Trial Class',
      type: 'single',
      price: 0,
      numberOfSessions: 1,
      description: 'A 30-minute introductory meeting to test capabilities.'
    });

    const calculusPkg = await Package.create({
      tutor: tutor1User._id,
      name: '10-Session Calculus Intensive',
      type: 'custom',
      price: 5000,
      numberOfSessions: 10,
      description: 'Comprehensive review of Limits, Derivatives, and Integrals.'
    });

    const monthlyAlgebraPkg = await Package.create({
      tutor: tutor1User._id,
      name: 'Monthly Algebra Support',
      type: 'monthly',
      price: 4000,
      numberOfSessions: 8,
      description: 'Twice-weekly sessions targeting basic and intermediate algebra equations.'
    });

    // 5. Create verified payment and schedule for Student Aswin (10-Session Calculus)
    console.log('Seeding Payments...');
    const verifiedPayment = await Payment.create({
      student: studentUser._id,
      tutor: tutor1User._id,
      package: calculusPkg._id,
      amount: 5000,
      transactionId: 'UTR123456789012',
      status: 'Verified',
      remainingSessions: 7, // 3 sessions already scheduled/taken
      submittedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
      verifiedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 + 10 * 60 * 1000),
      remarks: 'Verified automatically via seeding script'
    });

    // 6. Create pending verification payment
    const pendingPayment = await Payment.create({
      student: studentUser._id,
      tutor: tutor1User._id,
      package: monthlyAlgebraPkg._id,
      amount: 4000,
      transactionId: 'UTR987654321098',
      status: 'Pending Verification',
      remainingSessions: 8,
      submittedAt: new Date(Date.now() - 1 * 60 * 60 * 1000), // 1 hour ago
    });

    // 7. Seed Sessions (3 classes)
    console.log('Seeding Sessions...');
    const classDates = [
      new Date('2026-07-06T18:00:00'),
      new Date('2026-07-08T18:00:00'),
      new Date('2026-07-10T18:00:00')
    ];

    for (let i = 0; i < classDates.length; i++) {
      const session = await Session.create({
        tutor: tutor1User._id,
        student: studentUser._id,
        package: calculusPkg._id,
        payment: verifiedPayment._id,
        subject: 'Calculus - Limits & Functions',
        date: classDates[i],
        startTime: '18:00',
        endTime: '19:00',
        status: i === 0 ? 'Completed' : 'Scheduled'
      });

      if (i === 0) {
        // Log attendance for the completed session
        await Attendance.create({
          session: session._id,
          student: studentUser._id,
          status: 'Present',
          joinTime: new Date(classDates[i].getTime() + 2 * 60 * 1000), // joined 2 mins late
          leaveTime: new Date(classDates[i].getTime() + 62 * 60 * 1000), // left 1 hour later
          durationMinutes: 60,
          updatedBy: 'auto'
        });
      }
    }

    // 8. Seed Notifications
    console.log('Seeding Notifications...');
    await Notification.create({
      user: tutor1User._id,
      title: 'New Student Enrolled',
      message: 'Aswin Kumar submitted a payment for your 10-Session Calculus package.',
      type: 'payment'
    });

    await Notification.create({
      user: studentUser._id,
      title: 'Payment Approved',
      message: 'Your payment of INR 5000 has been verified. You can now configure your schedule.',
      type: 'payment'
    });

    console.log('==========================================');
    console.log('DATABASE SEEDED SUCCESSFULLY!');
    console.log('==========================================');
    console.log('ADMIN DETAILS:');
    console.log('Username: AswinMVK');
    console.log('Password: IamASWIN100%');
    console.log('------------------------------------------');
    console.log('TUTOR DETAILS (Priya Sharma):');
    console.log('Email:    priya.tutor@mentorium.com');
    console.log('Password: password123');
    console.log('------------------------------------------');
    console.log('STUDENT DETAILS (Aswin Kumar):');
    console.log('Email:    aswin.student@mentorium.com');
    console.log('Password: password123');
    console.log('==========================================');

    process.exit(0);
  } catch (error) {
    console.error('Error seeding data:', error.message);
    process.exit(1);
  }
};

seedData();
