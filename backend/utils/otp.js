const nodemailer = require('nodemailer');
const crypto = require('crypto');

// Create transporter for Gmail
const createTransporter = () => {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_PASS
    },
    tls: {
      rejectUnauthorized: false
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
    // Check if Gmail credentials are configured
    if (!process.env.GMAIL_USER || !process.env.GMAIL_PASS) {
      console.log('⚠️  Gmail SMTP not configured - using development mode');
      console.log('📧 Email OTP for development:');
      console.log(`   Email: ${email}`);
      console.log(`   OTP: ${otp}`);
      console.log(`   Subject: ${subject}`);
      console.log('   💡 To enable Gmail SMTP, see GMAIL_SETUP.md');
      return true;
    }

    console.log('📧 Sending OTP email via Gmail SMTP...');
    console.log(`   To: ${email}`);
    console.log(`   From: ${process.env.GMAIL_USER}`);
    
    const transporter = createTransporter();
    
    const mailOptions = {
      from: `"Media Gallery" <${process.env.GMAIL_USER}>`,
      to: email,
      subject: subject,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
          <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
            <h2 style="color: #333; text-align: center; margin-bottom: 20px;">📱 Media Gallery Verification</h2>
            <p style="color: #666; font-size: 16px;">Hello!</p>
            <p style="color: #666; font-size: 16px;">Your verification code is:</p>
            <div style="text-align: center; margin: 30px 0;">
              <h1 style="color: #007bff; font-size: 48px; letter-spacing: 8px; margin: 0; padding: 20px; background-color: #f8f9fa; border-radius: 8px; display: inline-block;">${otp}</h1>
            </div>
            <p style="color: #666; font-size: 14px; text-align: center;">⏰ This code will expire in <strong>10 minutes</strong></p>
            <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
            <p style="color: #999; font-size: 12px; text-align: center;">If you didn't request this verification, please ignore this email.</p>
            <p style="color: #999; font-size: 12px; text-align: center;">© Media Gallery Team</p>
          </div>
        </div>
      `
    };

    const result = await transporter.sendMail(mailOptions);
    console.log('✅ OTP email sent successfully!');
    console.log(`   Message ID: ${result.messageId}`);
    return true;
  } catch (error) {
    console.error('❌ Gmail SMTP Error:', error.message);
    if (error.code === 'EAUTH') {
      console.error('   🔐 Authentication failed - check your Gmail credentials in .env');
      console.error('   💡 Make sure you\'re using an App Password, not your regular Gmail password');
    } else if (error.code === 'ECONNECTION') {
      console.error('   🌐 Connection failed - check your internet connection');
    }
    console.error('   📖 See GMAIL_SETUP.md for configuration help');
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