const Session = require('../models/Session');
const Payment = require('../models/Payment');
const User = require('../models/User');
const Attendance = require('../models/Attendance');
const Notification = require('../models/Notification');
const Package = require('../models/Package');

// Generate sessions between two dates for given weekdays
const createSchedule = async (req, res) => {
  const { studentId, packageId, subject, startDate, endDate, daysOfWeek, startTime, durationHours } = req.body;

  try {
    const student = await User.findById(studentId);
    if (!student) {
      return res.status(404).json({ message: 'Student user not found' });
    }

    const pkg = await Package.findById(packageId);
    if (!pkg) {
      return res.status(404).json({ message: 'Selected package not found' });
    }

    // Verify student has an active verified payment package
    const activePayment = await Payment.findOne({
      student: studentId,
      tutor: req.user._id,
      package: packageId,
      status: 'Verified',
      remainingSessions: { $gt: 0 }
    });

    // Parse dates
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    if (isNaN(start.getTime()) || isNaN(end.getTime()) || start > end) {
      return res.status(400).json({ message: 'Invalid date range' });
    }

    // Parse startTime to hours and minutes
    const [startH, startM] = startTime.split(':').map(Number);
    const durationMin = Math.round((durationHours || 1) * 60);

    // Days mapping for JS Date getDay(): Sunday is 0, Monday is 1, ..., Saturday is 6
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const targetDayIndices = daysOfWeek.map(d => dayNames.indexOf(d)).filter(idx => idx !== -1);

    if (targetDayIndices.length === 0) {
      return res.status(400).json({ message: 'Please specify valid days of the week' });
    }

    let currentDate = new Date(start);
    const sessionsToCreate = [];
    const conflicts = [];

    // Count target sessions first
    let targetDaysCount = 0;
    while (currentDate <= end) {
      if (targetDayIndices.includes(currentDate.getDay())) {
        targetDaysCount++;
      }
      currentDate.setDate(currentDate.getDate() + 1);
    }

    // Reset currentDate for session creation
    currentDate = new Date(start);

    // Check if balance is sufficient IF a payment exists
    if (activePayment && targetDaysCount > activePayment.remainingSessions) {
      return res.status(400).json({
        message: `Schedule generates ${targetDaysCount} classes, but student only has ${activePayment.remainingSessions} remaining sessions. Please update date range or purchase a new package.`
      });
    }

    // Loop through all dates in the range
    while (currentDate <= end) {
      const dayIndex = currentDate.getDay();
      
      if (targetDayIndices.includes(dayIndex)) {
        // Create specific class start/end times
        const sessionDate = new Date(currentDate);
        
        // Calculate start time for the class
        const startDateTime = new Date(sessionDate);
        startDateTime.setHours(startH, startM, 0, 0);

        const endDateTime = new Date(startDateTime);
        endDateTime.setMinutes(endDateTime.getMinutes() + durationMin);

        const pad = (num) => String(num).padStart(2, '0');
        const calculatedEndTime = `${pad(endDateTime.getHours())}:${pad(endDateTime.getMinutes())}`;

        // Check for Tutor double booking (overlap)
        const overlap = await Session.findOne({
          tutor: req.user._id,
          date: {
            $gte: new Date(sessionDate.setHours(0,0,0,0)),
            $lte: new Date(sessionDate.setHours(23,59,59,999))
          },
          status: { $ne: 'Cancelled' },
          $or: [
            { startTime: { $lte: startTime }, endTime: { $gt: startTime } },
            { startTime: { $lt: calculatedEndTime }, endTime: { $gte: calculatedEndTime } },
            { startTime: { $gte: startTime }, endTime: { $lte: calculatedEndTime } }
          ]
        });

        if (overlap) {
          conflicts.push(`Conflict on ${currentDate.toDateString()} at ${startTime}`);
        } else {
          sessionsToCreate.push({
            tutor: req.user._id,
            student: studentId,
            package: packageId,
            payment: activePayment ? activePayment._id : null,
            subject,
            date: new Date(startDateTime),
            startTime,
            endTime: calculatedEndTime,
            status: 'Pending Student Approval'
          });
        }
      }
      
      // Move to next day
      currentDate.setDate(currentDate.getDate() + 1);
    }

    if (sessionsToCreate.length === 0) {
      return res.status(400).json({
        message: 'No sessions generated. Make sure selected weekdays occur in the date range.',
        conflicts
      });
    }

    // Insert sessions
    const createdSessions = await Session.insertMany(sessionsToCreate);

    // Notify Student
    await Notification.create({
      user: studentId,
      title: activePayment ? 'New Schedule Created' : 'New Prepaid Schedule Created (Payment Required)',
      message: activePayment 
        ? `Tutor ${req.user.name} created a schedule for ${subject} with ${createdSessions.length} classes.` 
        : `Tutor ${req.user.name} created a schedule for ${subject} with ${createdSessions.length} classes. Payment is required to unlock this schedule.`,
      type: 'schedule'
    });

    res.status(201).json({
      message: activePayment 
        ? `Successfully generated ${createdSessions.length} classes.`
        : `Successfully generated ${createdSessions.length} classes. Student has been notified to make a payment of INR ${pkg.price} to unlock the schedule.`,
      sessionsCount: createdSessions.length,
      conflicts,
      sessions: createdSessions
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error generating schedule', error: error.message });
  }
};

// Student confirms their pending sessions
const confirmSchedule = async (req, res) => {
  try {
    const { sessionIds } = req.body;
    
    if (!sessionIds || !Array.isArray(sessionIds)) {
      return res.status(400).json({ message: 'Invalid session list provided' });
    }

    // Find and update sessions
    const sessions = await Session.find({
      _id: { $in: sessionIds },
      student: req.user._id,
      status: 'Pending Student Approval'
    });

    if (sessions.length === 0) {
      return res.status(404).json({ message: 'No matching pending sessions found to confirm' });
    }

    for (let session of sessions) {
      session.status = 'Scheduled'; // Transitions to Scheduled -> Confirmed
      await session.save();

      // Decrement the payment's remaining sessions count
      const payment = await Payment.findById(session.payment);
      if (payment && payment.remainingSessions > 0) {
        payment.remainingSessions -= 1;
        await payment.save();
      }

      // Create attendance row as draft
      await Attendance.create({
        session: session._id,
        student: req.user._id,
        status: 'Absent', // default till attended or corrected
        updatedBy: 'auto'
      });
    }

    // Notify tutor
    if (sessions.length > 0) {
      await Notification.create({
        user: sessions[0].tutor,
        title: 'Schedule Confirmed by Student',
        message: `Student ${req.user.name} has confirmed ${sessions.length} sessions for their schedule.`,
        type: 'schedule'
      });
    }

    res.json({ message: `Confirmed ${sessions.length} sessions successfully. Status set to Scheduled.` });
  } catch (error) {
    res.status(500).json({ message: 'Error confirming sessions', error: error.message });
  }
};

// Get sessions for calendar / lists
const getSessions = async (req, res) => {
  try {
    let query = {};
    if (req.user.role === 'student') {
      query.student = req.user._id;
    } else if (req.user.role === 'tutor') {
      query.tutor = req.user._id;
    }

    const sessions = await Session.find(query)
      .populate('student', 'name email phone')
      .populate('tutor', 'name email phone')
      .populate('package', 'name type price numberOfSessions')
      .sort({ date: 1 });

    res.json(sessions);
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving sessions', error: error.message });
  }
};

// Request reschedule
const requestReschedule = async (req, res) => {
  const { sessionPostId, newDate, newStartTime, newEndTime } = req.body;
  try {
    const session = await Session.findById(sessionPostId);
    if (!session) {
      return res.status(404).json({ message: 'Session not found' });
    }

    const role = req.user.role; // student or tutor
    
    // Check ownership
    if (role === 'student' && session.student.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Unauthorized' });
    }
    if (role === 'tutor' && session.tutor.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    session.rescheduleRequest = {
      requestedBy: role,
      newDate: new Date(newDate),
      newStartTime,
      newEndTime,
      status: 'pending'
    };
    
    // Update status to Rescheduled (or state pending verification)
    session.status = 'Rescheduled';
    await session.save();

    // Create notifications for the other party
    const recipient = role === 'student' ? session.tutor : session.student;
    await Notification.create({
      user: recipient,
      title: 'Reschedule Requested',
      message: `${req.user.name} requested to reschedule session on ${new Date(session.date).toDateString()} to ${new Date(newDate).toDateString()} at ${newStartTime}.`,
      type: 'reschedule'
    });

    res.json({ message: 'Reschedule request submitted successfully', session });
  } catch (error) {
    res.status(500).json({ message: 'Error requesting reschedule', error: error.message });
  }
};

// Approve reschedule
const approveReschedule = async (req, res) => {
  const { approve } = req.body; // boolean
  try {
    const session = await Session.findById(req.params.id);
    if (!session) {
      return res.status(404).json({ message: 'Session not found' });
    }

    if (!session.rescheduleRequest || session.rescheduleRequest.status !== 'pending') {
      return res.status(400).json({ message: 'No active reschedule request found' });
    }

    // The other role must approve it
    const requestorRole = session.rescheduleRequest.requestedBy;
    if (req.user.role === requestorRole) {
      return res.status(403).json({ message: 'You cannot approve your own reschedule request' });
    }

    if (approve) {
      session.date = session.rescheduleRequest.newDate;
      session.startTime = session.rescheduleRequest.newStartTime;
      session.endTime = session.rescheduleRequest.newEndTime;
      session.status = 'Scheduled'; // Set back to active
      session.rescheduleRequest.status = 'approved';
      
      // Notify requestor
      const recipient = requestorRole === 'student' ? session.student : session.tutor;
      await Notification.create({
        user: recipient,
        title: 'Reschedule Request Approved',
        message: `Your reschedule request was approved. The session is now scheduled on ${new Date(session.date).toDateString()} at ${session.startTime}.`,
        type: 'reschedule'
      });
    } else {
      session.status = 'Scheduled'; // reset back to scheduled
      session.rescheduleRequest.status = 'rejected';

      // Notify requestor
      const recipient = requestorRole === 'student' ? session.student : session.tutor;
      await Notification.create({
        user: recipient,
        title: 'Reschedule Request Rejected',
        message: `Your reschedule request was rejected. The session date/time remains unchanged.`,
        type: 'reschedule'
      });
    }

    await session.save();
    res.json({ message: approve ? 'Reschedule request approved' : 'Reschedule request rejected', session });
  } catch (error) {
    res.status(500).json({ message: 'Error processing reschedule request', error: error.message });
  }
};

// Auto-mark attendance upon Student joining session
const joinSession = async (req, res) => {
  try {
    const session = await Session.findById(req.params.id);
    if (!session) {
      return res.status(404).json({ message: 'Session not found' });
    }

    if (session.student.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only the booked student can join the online session' });
    }

    session.status = 'Live';
    await session.save();

    // Auto mark attendance
    let attendance = await Attendance.findOne({ session: session._id, student: req.user._id });
    if (!attendance) {
      attendance = new Attendance({
        session: session._id,
        student: req.user._id
      });
    }

    attendance.status = 'Present';
    attendance.joinTime = Date.now();
    attendance.updatedBy = 'auto';
    await attendance.save();

    res.json({ message: 'Joined session successfully. Attendance marked Present.', session });
  } catch (error) {
    res.status(500).json({ message: 'Error joining session', error: error.message });
  }
};

// Tutor marks attendance manually / overrides
const markAttendance = async (req, res) => {
  const { studentId, status, joinTime, leaveTime, durationMinutes } = req.body;
  try {
    const session = await Session.findById(req.params.id);
    if (!session) {
      return res.status(404).json({ message: 'Session not found' });
    }

    if (session.tutor.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Unauthorized to log attendance for this session' });
    }

    let attendance = await Attendance.findOne({ session: session._id, student: studentId });
    if (!attendance) {
      attendance = new Attendance({
        session: session._id,
        student: studentId
      });
    }

    attendance.status = status;
    if (joinTime) attendance.joinTime = new Date(joinTime);
    if (leaveTime) attendance.leaveTime = new Date(leaveTime);
    if (durationMinutes) attendance.durationMinutes = durationMinutes;
    attendance.updatedBy = req.user.role;
    attendance.updatedAt = Date.now();
    await attendance.save();

    // If session is completed, we should also transition session state to Completed
    if (status === 'Present') {
      session.status = 'Completed';
    } else if (status === 'Absent') {
      session.status = 'Student Absent';
    }
    await session.save();

    res.json({ message: 'Attendance recorded successfully', attendance, session });
  } catch (error) {
    res.status(500).json({ message: 'Error marking attendance', error: error.message });
  }
};

// Get attendance records
const getAttendanceRecords = async (req, res) => {
  try {
    let query = {};
    if (req.user.role === 'student') {
      query.student = req.user._id;
    }
    
    // Find all attendance records populating session details
    const attendance = await Attendance.find(query)
      .populate({
        path: 'session',
        populate: [
          { path: 'tutor', select: 'name email' },
          { path: 'student', select: 'name email' }
        ]
      })
      .sort({ updatedAt: -1 });

    res.json(attendance);
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving attendance', error: error.message });
  }
};

// Cancel Session
const cancelSession = async (req, res) => {
  try {
    const session = await Session.findById(req.params.id);
    if (!session) {
      return res.status(404).json({ message: 'Session not found' });
    }

    // Owner checks
    if (session.student.toString() !== req.user._id.toString() && session.tutor.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    session.status = 'Cancelled';
    await session.save();

    // Refund session to package
    const payment = await Payment.findById(session.payment);
    if (payment) {
      payment.remainingSessions += 1;
      await payment.save();
    }

    const otherUser = req.user._id.toString() === session.student.toString() ? session.tutor : session.student;
    await Notification.create({
      user: otherUser,
      title: 'Class Cancelled',
      message: `The class scheduled for ${new Date(session.date).toDateString()} at ${session.startTime} was cancelled. A session has been refunded to the student's package.`,
      type: 'schedule'
    });

    res.json({ message: 'Session cancelled successfully, session refunded', session });
  } catch (error) {
    res.status(500).json({ message: 'Error cancelling session', error: error.message });
  }
};

const requestDemoClass = async (req, res) => {
  const { tutorId, subject, date, startTime } = req.body;

  try {
    const tutor = await User.findById(tutorId);
    if (!tutor || tutor.role !== 'tutor') {
      return res.status(404).json({ message: 'Tutor not found' });
    }

    // Calculate end time (default to 1 hour later)
    const [startH, startM] = startTime.split(':').map(Number);
    const endH = (startH + 1) % 24;
    const endTime = `${String(endH).padStart(2, '0')}:${String(startM).padStart(2, '0')}`;

    // Create session in "Pending Tutor Approval"
    const session = await Session.create({
      tutor: tutorId,
      student: req.user._id,
      subject: subject || 'Free Demo Class',
      date: new Date(date),
      startTime,
      endTime,
      status: 'Pending Tutor Approval',
      payment: null // for demo no payment is needed
    });

    // Notify tutor
    await Notification.create({
      user: tutorId,
      title: 'Free Demo Class Requested',
      message: `Student ${req.user.name} requested a free demo class for ${subject || 'Free Demo Class'} on ${new Date(date).toDateString()} at ${startTime}.`,
      type: 'schedule'
    });

    res.status(201).json({
      message: 'Demo class request submitted successfully.',
      session
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error requesting demo class', error: error.message });
  }
};

const acceptDemoClass = async (req, res) => {
  try {
    const session = await Session.findById(req.params.id);
    if (!session) {
      return res.status(404).json({ message: 'Session not found' });
    }

    if (session.tutor.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    if (session.status !== 'Pending Tutor Approval') {
      return res.status(400).json({ message: 'Session is not in pending approval status' });
    }

    session.status = 'Scheduled'; // Transition to Scheduled
    await session.save();

    // Create attendance row as draft
    await Attendance.create({
      session: session._id,
      student: session.student,
      status: 'Absent',
      updatedBy: 'auto'
    });

    // Notify student
    await Notification.create({
      user: session.student,
      title: 'Demo Class Request Accepted',
      message: `Tutor ${req.user.name} has accepted your demo class request for ${session.subject} on ${new Date(session.date).toDateString()} at ${session.startTime}.`,
      type: 'schedule'
    });

    res.json({ message: 'Demo class request accepted and scheduled successfully.', session });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error accepting demo class', error: error.message });
  }
};

module.exports = {
  createSchedule,
  confirmSchedule,
  getSessions,
  requestReschedule,
  approveReschedule,
  joinSession,
  markAttendance,
  getAttendanceRecords,
  cancelSession,
  requestDemoClass,
  acceptDemoClass
};
