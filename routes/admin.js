const express = require('express');
const {
  getPendingUsers,
  getAllUsers,
  approveUser,
  rejectUser,
  getDashboardStats
} = require('../controllers/adminController');
const { protect, adminOnly } = require('../middleware/auth');

const router = express.Router();

// All routes are protected and admin only
router.use(protect);
router.use(adminOnly);

router.get('/pending-users', getPendingUsers);
router.get('/users', getAllUsers);
router.put('/approve-user/:userId', approveUser);
router.put('/reject-user/:userId', rejectUser);
router.get('/stats', getDashboardStats);

module.exports = router;
