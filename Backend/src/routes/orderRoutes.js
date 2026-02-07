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
  getAllOrders,
  triggerSOS,
  updateRiderLocation,
  getPoolableOrders
} = require('../controller/orderController');
const { protect, authorize } = require('../middleware/authMiddleware');

// All routes require authentication
router.use(protect);

// Customer routes
router.post('/', authorize('customer'), createOrder);
router.get('/my-orders', authorize('customer'), getMyOrders);
router.put('/:id/cancel', cancelOrder); // Customer-only check is in controller (2-min window)

// Restaurant routes
router.get('/restaurant', authorize('restaurant'), getRestaurantOrders);
router.put('/:id/status', authorize('restaurant'), updateOrderStatus);
router.put('/:id/assign-rider', authorize('admin', 'restaurant'), assignRider);

// Delivery rider routes
router.get('/rider', authorize('delivery_staff'), getRiderOrders);
router.get('/available', authorize('delivery_staff'), getAvailableOrders);
router.get('/pools', authorize('delivery_staff'), getPoolableOrders);
router.put('/:id/accept', authorize('delivery_staff'), acceptOrder);
router.put('/:id/delivery-status', authorize('delivery_staff'), updateDeliveryStatus);
router.post('/:id/sos', authorize('delivery_staff'), triggerSOS);
router.post('/:id/location', authorize('delivery_staff'), updateRiderLocation);

// Admin routes
router.get('/stats', authorize('admin'), getOrderStats);
router.get('/admin', authorize('admin'), getAllOrders);

// Common routes (accessible to all authenticated users)
router.get('/:id', getOrderById);

module.exports = router;
