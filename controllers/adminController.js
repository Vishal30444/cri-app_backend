const User = require('../models/User');
const nodemailer = require('nodemailer');
const path = require('path');
const fs = require('fs');

// Email transporter configuration
const createTransporter = () => {
  return nodemailer.createTransporter({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: process.env.EMAIL_PORT || 587,
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });
};

// Generic email sender function
const sendEmail = async (templateName, user, extraData = {}) => {
  try {
    const emailTemplate = fs.readFileSync(
      path.join(__dirname, `../views/${templateName}.html`), 
      'utf-8'
    );
    
    let emailContent = emailTemplate
      .replace(/{{name}}/g, user.name)
      .replace(/{{email}}/g, user.email)
      .replace(/{{frontendUrl}}/g, process.env.FRONTEND_URL || 'http://localhost:3000');
    
    // Replace any extra placeholders
    Object.keys(extraData).forEach(key => {
      emailContent = emailContent.replace(new RegExp(`{{${key}}}`, 'g'), extraData[key]);
    });
    
    const transporter = createTransporter();
    
    const mailOptions = {
      from: `"CRI Simulator" <${process.env.EMAIL_USER}>`,
      to: user.email,
      subject: getEmailSubject(templateName),
      html: emailContent
    };
    
    const result = await transporter.sendMail(mailOptions);
    console.log(`Email sent to ${user.email}:`, result.messageId);
    return true;
  } catch (error) {
    console.error(`Email sending failed for ${templateName}:`, error);
    return false;
  }
};

// Email subject helper
const getEmailSubject = (templateName) => {
  const subjects = {
    'approval-email': '🎉 Your CRI Simulator Account is Approved!',
    'rejection-email': 'CRI Simulator Account Status Update',
    'welcome-email': '👋 Welcome to Climate Readiness Index Simulator',
    'password-reset': '🔐 Reset Your CRI Simulator Password'
  };
  return subjects[templateName] || 'CRI Simulator Notification';
};

// @desc    Get all pending user requests
// @route   GET /api/admin/pending-users
// @access  Private/Admin
exports.getPendingUsers = async (req, res) => {
  try {
    const pendingUsers = await User.find({ status: 'pending' })
      .select('-password')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: pendingUsers.length,
      data: pendingUsers
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get all users with their status
// @route   GET /api/admin/users
// @access  Private/Admin
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find({ role: 'user' })
      .select('-password')
      .populate('approvedBy', 'name email')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: users.length,
      data: users
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Approve user
// @route   PUT /api/admin/approve-user/:userId
// @access  Private/Admin
exports.approveUser = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (user.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: `User is already ${user.status}`
      });
    }

    user.status = 'approved';
    user.approvedBy = req.user.id;
    user.approvedAt = new Date();

    await user.save();

    // Send approval email
    await sendEmail('approval-email', user);

    res.status(200).json({
      success: true,
      message: 'User approved successfully',
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          status: user.status,
          approvedAt: user.approvedAt
        }
      }
    });
  } catch (error) {
    console.error('Approve user error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Reject user
// @route   PUT /api/admin/reject-user/:userId
// @access  Private/Admin
exports.rejectUser = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (user.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: `User is already ${user.status}`
      });
    }

    user.status = 'rejected';
    user.approvedBy = req.user.id;
    user.approvedAt = new Date();

    await user.save();

    // Send rejection email
    await sendEmail('rejection-email', user);

    res.status(200).json({
      success: true,
      message: 'User rejected successfully',
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          status: user.status
        }
      }
    });
  } catch (error) {
    console.error('Reject user error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get admin dashboard stats
// @route   GET /api/admin/stats
// @access  Private/Admin
exports.getDashboardStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments({ role: 'user' });
    const pendingUsers = await User.countDocuments({ status: 'pending' });
    const approvedUsers = await User.countDocuments({ status: 'approved' });
    const rejectedUsers = await User.countDocuments({ status: 'rejected' });

    res.status(200).json({
      success: true,
      data: {
        totalUsers,
        pendingUsers,
        approvedUsers,
        rejectedUsers
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Send welcome email to new users
// @route   POST /api/admin/send-welcome/:userId
// @access  Private/Admin
exports.sendWelcomeEmail = async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const emailSent = await sendEmail('welcome-email', user);

    if (emailSent) {
      res.status(200).json({
        success: true,
        message: 'Welcome email sent successfully'
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Failed to send welcome email'
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};
