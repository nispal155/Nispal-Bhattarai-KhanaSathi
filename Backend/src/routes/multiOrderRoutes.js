const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const {
    getMultiOrderById,
    getMyMultiOrders,
    assignRiderToMultiOrder,
    getMultiOrderTracking,
    markSubOrderPickedUp,
    updateMultiOrderDeliveryStatus,
    cancelMultiOrder,
    getRiderMultiOrders,
    updateRiderLocation,
    getAvailableMultiOrders
} = require('../controller/multiOrderController');

// Customer routes
router.get('/my-orders', protect, getMyMultiOrders);
router.get('/:id', protect, getMultiOrderById);
router.get('/:id/tracking', protect, getMultiOrderTracking);
router.put('/:id/cancel', protect, cancelMultiOrder);

// Rider routes
router.get('/rider/orders', protect, authorize('delivery_staff'), getRiderMultiOrders);
router.get('/available', protect, authorize('delivery_staff'), getAvailableMultiOrders);
router.put('/:id/pickup/:subOrderId', protect, authorize('delivery_staff'), markSubOrderPickedUp);
router.put('/:id/delivery-status', protect, authorize('delivery_staff'), updateMultiOrderDeliveryStatus);
router.post('/:id/location', protect, authorize('delivery_staff'), updateRiderLocation);

// Admin/Restaurant routes
router.put('/:id/assign-rider', protect, authorize('admin', 'restaurant_manager'), assignRiderToMultiOrder);

module.exports = router;
