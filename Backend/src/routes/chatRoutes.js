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

// ── New thread-aware routes ──
router.get('/active', protect, getActiveChats);
router.get('/:orderId/availability', protect, getChatAvailability);
router.get('/:orderId/:thread(customer-restaurant|customer-rider|restaurant-rider)', protect, getThreadMessages);
router.post('/:orderId/:thread(customer-restaurant|customer-rider|restaurant-rider)', protect, sendThreadMessage);
router.put('/:orderId/:thread(customer-restaurant|customer-rider|restaurant-rider)/read', protect, markThreadAsRead);

// ── Legacy routes (backward compat) ──
router.get('/:orderId', protect, getOrderMessages);
router.post('/:orderId', protect, sendMessage);
router.put('/:orderId/read', protect, markAsRead);

module.exports = router;
