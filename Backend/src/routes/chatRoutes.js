const express = require('express');
const { getOrderMessages, markAsRead } = require('../controller/chatController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/:orderId', protect, getOrderMessages);
router.put('/:orderId/read', protect, markAsRead);

module.exports = router;
