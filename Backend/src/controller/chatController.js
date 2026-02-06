const Message = require('../models/Message');
const Order = require('../models/Order');
const Notification = require('../models/Notification');
const { getIO } = require('../services/socket');

/**
 * @desc    Get chat history for an order
 * @route   GET /api/chat/:orderId
 * @access  Private
 */
exports.getOrderMessages = async (req, res) => {
    try {
        const messages = await Message.find({ order: req.params.orderId })
            .sort({ createdAt: 1 })
            .populate('sender', 'name username profilePicture');

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
 * @desc    Send a chat message for an order
 * @route   POST /api/chat/:orderId
 * @access  Private
 */
exports.sendMessage = async (req, res) => {
    try {
        const { orderId } = req.params;
        const { message, senderRole, attachments } = req.body;
        const senderId = req.user._id;

        // Validate order exists
        const order = await Order.findById(orderId)
            .populate('user', 'name')
            .populate('restaurant', 'name owner')
            .populate('assignedRider', 'name');

        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }

        // Verify user is authorized to chat on this order
        const isCustomer = order.user._id.toString() === senderId.toString();
        const isRestaurantOwner = order.restaurant.owner?.toString() === senderId.toString();
        const isRider = order.assignedRider?._id?.toString() === senderId.toString();
        const isAdmin = req.user.role === 'admin';

        if (!isCustomer && !isRestaurantOwner && !isRider && !isAdmin) {
            return res.status(403).json({
                success: false,
                message: 'You are not authorized to send messages for this order'
            });
        }

        // Create the message
        const newMessage = await Message.create({
            order: orderId,
            sender: senderId,
            senderRole: senderRole || req.user.role,
            content: message,
            attachments: attachments || []
        });

        // Populate sender info for response
        await newMessage.populate('sender', 'name username profilePicture');

        // Emit real-time update via socket
        try {
            const io = getIO();
            io.to(orderId).emit('newMessage', newMessage);
        } catch (socketError) {
            console.log('Socket not available for real-time update');
        }

        // Create notifications for recipients
        const recipients = [];
        
        if (senderRole === 'customer' || isCustomer) {
            // Notify restaurant
            if (order.restaurant.owner) {
                recipients.push(order.restaurant.owner);
            }
            // Notify rider if assigned
            if (order.assignedRider?._id) {
                recipients.push(order.assignedRider._id);
            }
        } else if (senderRole === 'restaurant') {
            // Notify customer
            recipients.push(order.user._id);
            // Notify rider if assigned
            if (order.assignedRider?._id) {
                recipients.push(order.assignedRider._id);
            }
        } else if (senderRole === 'delivery_staff' || senderRole === 'rider') {
            // Notify customer and restaurant
            recipients.push(order.user._id);
            if (order.restaurant.owner) {
                recipients.push(order.restaurant.owner);
            }
        }

        // Remove sender from recipients
        const filteredRecipients = recipients.filter(
            r => r.toString() !== senderId.toString()
        );

        // Create notifications
        for (const recipientId of filteredRecipients) {
            await Notification.create({
                user: recipientId,
                type: 'chat_message',
                title: 'New Message',
                message: `New message for order #${orderId.toString().slice(-6)}: "${message.substring(0, 50)}${message.length > 50 ? '...' : ''}"`,
                data: { orderId, chatId: orderId }
            });
        }

        res.status(201).json({
            success: true,
            data: newMessage
        });
    } catch (error) {
        console.error('Send message error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to send message',
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
