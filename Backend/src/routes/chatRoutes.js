const express = require('express');
const { getOrderMessages, sendMessage, markAsRead } = require('../controller/chatController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

// Get chat history for an order
router.get('/:orderId', protect, getOrderMessages);

// Send a new message for an order
router.post('/:orderId', protect, sendMessage);

// Mark messages as read
router.put('/:orderId/read', protect, markAsRead);

module.exports = router;
