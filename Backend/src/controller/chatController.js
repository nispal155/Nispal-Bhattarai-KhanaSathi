const Message = require('../models/Message');

/**
 * @desc    Get chat history for an order
 * @route   GET /api/chat/:orderId
 * @access  Private
 */
exports.getOrderMessages = async (req, res) => {
    try {
        const messages = await Message.find({ order: req.params.orderId })
            .sort({ createdAt: 1 })
            .populate('sender', 'name profilePicture');

        res.status(200).json({
            success: true,
            data: messages
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to fetch messages',
            error: error.message
        });
    }
};

/**
 * @desc    Mark messages as read
 * @route   PUT /api/chat/:orderId/read
 * @access  Private
 */
exports.markAsRead = async (req, res) => {
    try {
        await Message.updateMany(
            {
                order: req.params.orderId,
                sender: { $ne: req.user._id },
                isRead: false
            },
            { isRead: true }
        );

        res.status(200).json({
            success: true,
            message: 'Messages marked as read'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to update messages',
            error: error.message
        });
    }
};
