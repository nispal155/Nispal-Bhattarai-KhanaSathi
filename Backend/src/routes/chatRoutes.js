const express = require('express');
const {
    getActiveChats,
    getChatAvailability,
    getThreadMessages,
    sendThreadMessage,
    markThreadAsRead,
    getOrderMessages,
    sendMessage,
    markAsRead
} = require('../controller/chatController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

// Validate the :thread param before reaching the controller
const VALID_THREADS = ['customer-restaurant', 'customer-rider', 'restaurant-rider'];
const validateThread = (req, res, next) => {
    if (!VALID_THREADS.includes(req.params.thread)) {
        return res.status(400).json({ message: `Invalid chat thread. Must be one of: ${VALID_THREADS.join(', ')}` });
    }
    next();
};

// ── New thread-aware routes ──
router.get('/active', protect, getActiveChats);
router.get('/:orderId/availability', protect, getChatAvailability);
router.get('/:orderId/:thread', protect, validateThread, getThreadMessages);
router.post('/:orderId/:thread', protect, validateThread, sendThreadMessage);
router.put('/:orderId/:thread/read', protect, validateThread, markThreadAsRead);

// ── Legacy routes (backward compat) ──
router.get('/:orderId', protect, getOrderMessages);
router.post('/:orderId', protect, sendMessage);
router.put('/:orderId/read', protect, markAsRead);

module.exports = router;
