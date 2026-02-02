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
  getOrderStats,
  triggerSOS,
  updateRiderLocation,
  getPoolableOrders
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
router.get('/pools', getPoolableOrders);
router.put('/:id/accept', acceptOrder);
router.put('/:id/delivery-status', updateDeliveryStatus);
router.post('/:id/sos', triggerSOS);
router.post('/:id/location', updateRiderLocation);

// Admin routes
router.get('/stats', getOrderStats);

// Common routes
router.get('/:id', getOrderById);

module.exports = router;
