const express = require('express');
const router = express.Router();
const {
  createOrder,
  getMyOrders,
  getOrderById,
  getRestaurantOrders,
  updateOrderStatus,
  assignRider,
  getRiderOrders,
  getAvailableOrders,
  acceptOrder,
  updateDeliveryStatus,
  cancelOrder,
  getOrderStats
} = require('../controller/orderController');
const { protect } = require('../middleware/authMiddleware');

// All routes require authentication
router.use(protect);

// Customer routes
router.post('/', createOrder);
router.get('/my-orders', getMyOrders);
router.put('/:id/cancel', cancelOrder);

// Restaurant routes
router.get('/restaurant', getRestaurantOrders);
router.put('/:id/status', updateOrderStatus);
router.put('/:id/assign-rider', assignRider);

// Delivery rider routes
router.get('/rider', getRiderOrders);
router.get('/available', getAvailableOrders);
router.put('/:id/accept', acceptOrder);
router.put('/:id/delivery-status', updateDeliveryStatus);

// Admin routes
router.get('/stats', getOrderStats);

// Common routes
router.get('/:id', getOrderById);

module.exports = router;
