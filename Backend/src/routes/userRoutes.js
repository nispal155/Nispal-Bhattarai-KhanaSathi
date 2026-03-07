const express = require('express');
const router = express.Router();
const {
  getProfile,
  updateProfile,
  getAddresses,
  addAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress,
  createChildAccount,
  getMyChildAccounts,
  updateChildAccount,
  deleteChildAccount,
  submitChildOnboarding,
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
  getUserStats
} = require('../controller/userController');
const { protect, authorize } = require('../middleware/authMiddleware');

// All routes require authentication
router.use(protect);

// User profile routes
router.get('/profile', getProfile);
router.put('/profile', updateProfile);

// Address routes
router.get('/addresses', getAddresses);
router.post('/addresses', addAddress);
router.put('/addresses/:id', updateAddress);
router.put('/addresses/:id/set-default', setDefaultAddress);
router.delete('/addresses/:id', deleteAddress);

// Parent-child account routes
router.get('/children', getMyChildAccounts);
router.post('/children', createChildAccount);
router.put('/children/:childId', updateChildAccount);
router.delete('/children/:childId', deleteChildAccount);
router.post('/child-onboarding', submitChildOnboarding);

// Admin routes
router.get('/stats', authorize('admin'), getUserStats);
router.get('/', authorize('admin'), getAllUsers);
router.get('/:id', authorize('admin'), getUserById);
router.put('/:id', authorize('admin'), updateUser);
router.delete('/:id', authorize('admin'), deleteUser);

module.exports = router;
