const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
    getNotifications,
    markAsRead,
    markAllRead,
    deleteNotification
} = require('../controller/notificationController');

// All notification routes are protected
router.use(protect);

router.get('/', getNotifications);
router.put('/mark-all-read', markAllRead);
router.put('/:id/mark-read', markAsRead);
router.delete('/:id', deleteNotification);

module.exports = router;
