const express = require('express');
const router = express.Router();
const {
    initiateEsewaPayment,
    initiateEsewaFromCart,
    verifyEsewaPayment,
    initiateKhaltiPayment,
    initiateKhaltiFromCart,
    verifyKhaltiPayment,
    getPaymentStatus
} = require('../controller/paymentController');
const { protect } = require('../middleware/authMiddleware');

// Health check endpoint (no auth required)
router.get('/health', (req, res) => {
    res.json({ success: true, message: 'Payment API is working' });
});

// Verify endpoints - no auth required (called from payment gateway callback)
router.post('/esewa/verify', verifyEsewaPayment);
router.post('/khalti/verify', verifyKhaltiPayment);

// Protected routes (require authentication)
router.use(protect);

// eSewa routes - New flow (from cart, before order creation)
router.post('/esewa/initiate-from-cart', initiateEsewaFromCart);
// Legacy route for existing orders
router.post('/esewa/initiate', initiateEsewaPayment);

// Khalti routes - New flow (from cart, before order creation)
router.post('/khalti/initiate-from-cart', initiateKhaltiFromCart);
// Legacy route for existing orders
router.post('/khalti/initiate', initiateKhaltiPayment);

// Payment status
router.get('/:orderId/status', getPaymentStatus);

module.exports = router;
