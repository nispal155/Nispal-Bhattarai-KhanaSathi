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
router.get('/:id', getMenuItemById);

// Protected routes (Restaurant Manager)
router.get('/my-menu', protect, getMyMenu);
router.post('/', protect, createMenuItem);
router.put('/:id', protect, updateMenuItem);
router.put('/:id/toggle-availability', protect, toggleAvailability);
router.delete('/:id', protect, deleteMenuItem);

module.exports = router;
