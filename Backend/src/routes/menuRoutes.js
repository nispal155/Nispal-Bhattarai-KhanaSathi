const express = require('express');
const router = express.Router();
const {
  createMenuItem,
  getMenuByRestaurant,
  getMyMenu,
  getMenuItemById,
  updateMenuItem,
  deleteMenuItem,
  toggleAvailability,
  searchMenuItems
} = require('../controller/menuController');
const { protect } = require('../middleware/authMiddleware');

// Public routes
router.get('/search', searchMenuItems);
router.get('/restaurant/:restaurantId', getMenuByRestaurant);

// Protected routes (Restaurant Manager) - MUST come before /:id
router.get('/my-menu', protect, getMyMenu);
router.post('/', protect, createMenuItem);
router.put('/:id/toggle-availability', protect, toggleAvailability);
router.put('/:id', protect, updateMenuItem);
router.delete('/:id', protect, deleteMenuItem);

// This must be LAST - catches any id parameter
router.get('/:id', getMenuItemById);

module.exports = router;

