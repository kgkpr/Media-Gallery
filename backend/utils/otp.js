const nodemailer = require('nodemailer');
const crypto = require('crypto');

// Create transporter for Gmail
const createTransporter = () => {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_PASS
    }
  });
};

// Generate OTP
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Generate verification token
const generateVerificationToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

// Send OTP email
const sendOTPEmail = async (email, otp, subject = 'Email Verification') => {
  try {
    // For development, just log the OTP instead of sending email
    if (!process.env.GMAIL_USER || !process.env.GMAIL_PASS) {
      console.log('📧 Email OTP for development:');
      console.log(`   Email: ${email}`);
      console.log(`   OTP: ${otp}`);
      console.log(`   Subject: ${subject}`);
      console.log('   (In production, this would be sent via email)');
      return true;
    }

    const transporter = createTransporter();
    
    const mailOptions = {
      from: process.env.GMAIL_USER,
      to: email,
      subject: subject,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Media Gallery Verification</h2>
          <p>Your verification code is:</p>
          <h1 style="color: #007bff; font-size: 48px; text-align: center; letter-spacing: 8px;">${otp}</h1>
          <p>This code will expire in 10 minutes.</p>
          <p>If you didn't request this, please ignore this email.</p>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error('Email sending error:', error);
    return false;
  }
};

// Send password reset email
const sendPasswordResetEmail = async (email, resetToken) => {
  try {
    // For development, just log the reset link instead of sending email
    if (!process.env.GMAIL_USER || !process.env.GMAIL_PASS) {
      console.log('📧 Password reset for development:');
      console.log(`   Email: ${email}`);
      console.log(`   Reset Token: ${resetToken}`);
      console.log(`   Reset URL: ${process.env.FRONTEND_URL}/reset-password/${resetToken}`);
      console.log('   (In production, this would be sent via email)');
      return true;
    }

    const transporter = createTransporter();
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;
    
    const mailOptions = {
      from: process.env.GMAIL_USER,
      to: email,
      subject: 'Password Reset Request',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Password Reset Request</h2>
          <p>You requested a password reset for your Media Gallery account.</p>
          <p>Click the link below to reset your password:</p>
          <a href="${resetUrl}" style="display: inline-block; background: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px;">Reset Password</a>
          <p>This link will expire in 1 hour.</p>
          <p>If you didn't request this, please ignore this email.</p>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error('Password reset email error:', error);
    return false;
  }
};

module.exports = {
  generateOTP,
  generateVerificationToken,
  sendOTPEmail,
  sendPasswordResetEmail
}; 