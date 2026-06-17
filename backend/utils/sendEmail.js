const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');

const sendPaymentEmail = async (paymentData, studentUser, tutorUser, packageData) => {
  const emailContent = `
========================================
NEW PAYMENT SUBMISSION - MENTORIUM EDUHUB
========================================
Student Name:    ${studentUser.name}
Student Email:   ${studentUser.email}
Student Phone:   ${studentUser.phone}
Student ID:      ${studentUser._id}

Tutor Name:      ${tutorUser.name}
Tutor Email:     ${tutorUser.email}

Package Name:    ${packageData.name}
Package Type:    ${packageData.type}
Total Sessions:  ${packageData.numberOfSessions}
Price:           INR ${packageData.price}

Amount Paid:     INR ${paymentData.amount}
Transaction ID:  ${paymentData.transactionId} (UTR Number)
Date & Time:     ${new Date(paymentData.submittedAt).toLocaleString()}
Screenshot:      ${paymentData.screenshot ? 'Attached (Base64 data in db)' : 'None Provided'}
========================================
`;

  // Always log to a local file for audit and easy testing
  try {
    const logPath = path.join(__dirname, '..', 'emails_sent_log.txt');
    fs.appendFileSync(logPath, emailContent + '\n');
    console.log(`Payment email logged successfully to ${logPath}`);
  } catch (err) {
    console.error('Failed to log email to file:', err.message);
  }

  // Set up Nodemailer transporter
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER || 'mentorium.eduhub@gmail.com',
      pass: process.env.EMAIL_PASS || 'your_gmail_app_password'
    }
  });

  const mailOptions = {
    from: process.env.EMAIL_USER || 'mentorium.eduhub@gmail.com',
    to: 'mentorium.eduhub@gmail.com',
    subject: `Payment Verification Request - ${studentUser.name} - UTR: ${paymentData.transactionId}`,
    text: emailContent
  };

  // If a base64 screenshot exists, attach it as an inline file
  if (paymentData.screenshot && paymentData.screenshot.startsWith('data:image')) {
    const matches = paymentData.screenshot.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    if (matches && matches.length === 3) {
      const extension = matches[1].split('/')[1] || 'png';
      const buffer = Buffer.from(matches[2], 'base64');
      mailOptions.attachments = [
        {
          filename: `receipt_${paymentData.transactionId}.${extension}`,
          content: buffer
        }
      ];
    }
  }

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Nodemailer Email sent: ' + info.response);
    return true;
  } catch (error) {
    console.warn('Nodemailer failed (probably incorrect credentials in .env). Email logged locally instead. Error:', error.message);
    return false;
  }
};

module.exports = { sendPaymentEmail };
