const Message = require('../models/Message');
const Order = require('../models/Order');
const Restaurant = require('../models/Restaurant');
const Notification = require('../models/Notification');
const { getIO } = require('../services/socket');

// ─── Helpers ────────────────────────────────────────────────────────────────

const ACTIVE_STATUSES = ['pending', 'confirmed', 'preparing', 'ready', 'picked_up', 'on_the_way'];
const CLOSED_STATUSES = ['delivered', 'cancelled'];
const THREAD_ENUM = ['customer-restaurant', 'customer-rider', 'restaurant-rider'];

/** Which chat threads are available for an order based on status */
function getAvailableThreads(order) {
    if (CLOSED_STATUSES.includes(order.status)) return [];
    const threads = [];
    if (ACTIVE_STATUSES.includes(order.status)) threads.push('customer-restaurant');
    if (order.deliveryRider && !['pending'].includes(order.status)) {
        threads.push('customer-rider');
        threads.push('restaurant-rider');
    }
    return threads;
}

/** Resolve restaurant owner id (supports both createdBy and owner fields) */
function getRestaurantOwnerId(order) {
    return (order.restaurant?.createdBy || order.restaurant?.owner || '').toString();
}

/** Check if user may access a given thread */
function isAuthorizedForThread(order, userId, userRole, thread) {
    if (userRole === 'admin') return true;
    const uid = userId.toString();
    const customerId = (order.customer?._id || order.customer || '').toString();
    const ownerId = getRestaurantOwnerId(order);
    const riderId = (order.deliveryRider?._id || order.deliveryRider || '').toString();
    switch (thread) {
        case 'customer-restaurant': return uid === customerId || uid === ownerId;
        case 'customer-rider': return uid === customerId || uid === riderId;
        case 'restaurant-rider': return uid === ownerId || uid === riderId;
        default: return false;
    }
}

/** Collect the other participant ids for a thread */
function getRecipients(order, senderId, thread) {
    const sid = senderId.toString();
    const ids = [];
    const customerId = order.customer?._id || order.customer;
    const ownerId = order.restaurant?.createdBy || order.restaurant?.owner;
    const riderId = order.deliveryRider?._id || order.deliveryRider;
    switch (thread) {
        case 'customer-restaurant':
            if (customerId && customerId.toString() !== sid) ids.push(customerId);
            if (ownerId && ownerId.toString() !== sid) ids.push(ownerId);
            break;
        case 'customer-rider':
            if (customerId && customerId.toString() !== sid) ids.push(customerId);
            if (riderId && riderId.toString() !== sid) ids.push(riderId);
            break;
        case 'restaurant-rider':
            if (ownerId && ownerId.toString() !== sid) ids.push(ownerId);
            if (riderId && riderId.toString() !== sid) ids.push(riderId);
            break;
    }
    return ids;
}

/** Build participant display info for the "other side" of a thread */
function threadParticipantInfo(order, userId, thread) {
    const uid = userId.toString();
    const customerId = (order.customer?._id || order.customer || '').toString();
    const ownerId = getRestaurantOwnerId(order);

    switch (thread) {
        case 'customer-restaurant':
            if (uid === customerId) return { participantName: order.restaurant?.name || 'Restaurant', participantRole: 'restaurant', participantAvatar: order.restaurant?.logoUrl || '' };
            return { participantName: order.customer?.username || 'Customer', participantRole: 'customer', participantAvatar: order.customer?.profilePicture || '' };
        case 'customer-rider':
            if (uid === customerId) return { participantName: order.deliveryRider?.username || 'Rider', participantRole: 'delivery_staff', participantAvatar: order.deliveryRider?.profilePicture || '' };
            return { participantName: order.customer?.username || 'Customer', participantRole: 'customer', participantAvatar: order.customer?.profilePicture || '' };
        case 'restaurant-rider':
            if (uid === ownerId) return { participantName: order.deliveryRider?.username || 'Rider', participantRole: 'delivery_staff', participantAvatar: order.deliveryRider?.profilePicture || '' };
            return { participantName: order.restaurant?.name || 'Restaurant', participantRole: 'restaurant', participantAvatar: order.restaurant?.logoUrl || '' };
        default: return { participantName: '', participantRole: '', participantAvatar: '' };
    }
}

// ─── Thread-aware Endpoints ─────────────────────────────────────────────────

/**
 * @desc    Chat availability for an order
 * @route   GET /api/chat/:orderId/availability
 */
exports.getChatAvailability = async (req, res) => {
    try {
        const order = await Order.findById(req.params.orderId)
            .populate('restaurant', 'name createdBy logoUrl owner')
            .populate('customer', 'username profilePicture')
            .populate('deliveryRider', 'username profilePicture');
        if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

        const threads = getAvailableThreads(order)
            .filter(t => isAuthorizedForThread(order, req.user._id, req.user.role, t))
            .map(t => ({ thread: t, ...threadParticipantInfo(order, req.user._id, t) }));

        res.json({ success: true, data: { orderId: order._id, orderNumber: order.orderNumber, orderStatus: order.status, threads } });
    } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

/**
 * @desc    Get messages for a specific thread
 * @route   GET /api/chat/:orderId/:thread
 */
exports.getThreadMessages = async (req, res) => {
    try {
        const { orderId, thread } = req.params;
        if (!THREAD_ENUM.includes(thread)) return res.status(400).json({ success: false, message: 'Invalid chat thread' });

        const order = await Order.findById(orderId)
            .populate('restaurant', 'name createdBy owner')
            .populate('deliveryRider', 'username');
        if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
        if (!isAuthorizedForThread(order, req.user._id, req.user.role, thread))
            return res.status(403).json({ success: false, message: 'Not authorized' });

        const messages = await Message.find({ order: orderId, chatThread: thread })
            .sort({ createdAt: 1 })
            .populate('sender', 'username profilePicture');

        res.json({ success: true, data: messages });
    } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

/**
 * @desc    Send a message to a specific thread
 * @route   POST /api/chat/:orderId/:thread
 */
exports.sendThreadMessage = async (req, res) => {
    try {
        const { orderId, thread } = req.params;
        const { message, attachments } = req.body;
        if (!THREAD_ENUM.includes(thread)) return res.status(400).json({ success: false, message: 'Invalid chat thread' });
        if (!message?.trim()) return res.status(400).json({ success: false, message: 'Message content required' });

        const order = await Order.findById(orderId)
            .populate('restaurant', 'name createdBy owner')
            .populate('customer', 'username')
            .populate('deliveryRider', 'username');
        if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

        if (!getAvailableThreads(order).includes(thread))
            return res.status(400).json({ success: false, message: 'Chat not available for current order status' });
        if (!isAuthorizedForThread(order, req.user._id, req.user.role, thread))
            return res.status(403).json({ success: false, message: 'Not authorized' });

        let senderRole = req.user.role;
        if (senderRole === 'delivery_staff') senderRole = 'rider';
        if (senderRole === 'restaurant_admin') senderRole = 'restaurant';

        const newMsg = await Message.create({
            order: orderId, chatThread: thread, sender: req.user._id, senderRole,
            messageType: 'user', content: message.trim(), attachments: attachments || [],
            readBy: [req.user._id]
        });
        await newMsg.populate('sender', 'username profilePicture');

        // Emit to thread room + legacy room
        try {
            const io = getIO();
            const room = `${orderId}:${thread}`;
            io.to(room).emit('newMessage', newMsg);
            io.to(orderId).emit('newMessage', newMsg);
        } catch (e) {
            console.error('Socket emission error:', e);
        }

        // Notifications
        const orderNum = order.orderNumber || orderId.toString().slice(-6);
        for (const rid of getRecipients(order, req.user._id, thread)) {
            try {
                await Notification.create({ user: rid, type: 'chat_message', title: 'New Message', message: `Message on order #${orderNum}`, data: { orderId, thread } });
                const io = getIO(); io.to(rid.toString()).emit('notification', { type: 'chat_message', orderId, thread });
            } catch (e) { }
        }

        res.status(201).json({ success: true, data: newMsg });
    } catch (err) { console.error('sendThreadMessage', err); res.status(500).json({ success: false, message: err.message }); }
};

/**
 * @desc    Mark thread messages as read
 * @route   PUT /api/chat/:orderId/:thread/read
 */
exports.markThreadAsRead = async (req, res) => {
    try {
        const { orderId, thread } = req.params;
        await Message.updateMany(
            { order: orderId, chatThread: thread, readBy: { $ne: req.user._id } },
            { $addToSet: { readBy: req.user._id } }
        );
        try { const io = getIO(); io.to(`${orderId}:${thread}`).emit('messagesRead', { userId: req.user._id.toString(), thread }); } catch (e) { }
        res.json({ success: true, message: 'Marked as read' });
    } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

/**
 * @desc    Active chat threads for current user
 * @route   GET /api/chat/active
 */
exports.getActiveChats = async (req, res) => {
    try {
        const userId = req.user._id;
        const role = req.user.role;
        let orders = [];

        if (role === 'customer') {
            orders = await Order.find({ customer: userId, status: { $in: ACTIVE_STATUSES } })
                .populate('restaurant', 'name createdBy owner logoUrl')
                .populate('deliveryRider', 'username profilePicture').sort({ updatedAt: -1 });
        } else if (role === 'restaurant' || role === 'restaurant_admin') {
            const rIds = (await Restaurant.find({ createdBy: userId })).map(r => r._id);
            orders = await Order.find({ restaurant: { $in: rIds }, status: { $in: ACTIVE_STATUSES } })
                .populate('restaurant', 'name createdBy owner logoUrl')
                .populate('customer', 'username profilePicture')
                .populate('deliveryRider', 'username profilePicture').sort({ updatedAt: -1 });
        } else if (role === 'delivery_staff') {
            orders = await Order.find({ deliveryRider: userId, status: { $in: ACTIVE_STATUSES } })
                .populate('restaurant', 'name createdBy owner logoUrl')
                .populate('customer', 'username profilePicture').sort({ updatedAt: -1 });
        } else if (role === 'admin') {
            orders = await Order.find({ status: { $in: ACTIVE_STATUSES } })
                .populate('restaurant', 'name createdBy owner logoUrl')
                .populate('customer', 'username profilePicture')
                .populate('deliveryRider', 'username profilePicture').sort({ updatedAt: -1 }).limit(50);
        }

        const list = [];
        for (const order of orders) {
            const userThreads = getAvailableThreads(order).filter(t => isAuthorizedForThread(order, userId, role, t));
            for (const thread of userThreads) {
                const lastMsg = await Message.findOne({ order: order._id, chatThread: thread }).sort({ createdAt: -1 }).populate('sender', 'username');
                const unread = await Message.countDocuments({ order: order._id, chatThread: thread, readBy: { $ne: userId } });
                const info = threadParticipantInfo(order, userId, thread);
                list.push({
                    orderId: order._id, orderNumber: order.orderNumber, orderStatus: order.status,
                    thread, ...info,
                    lastMessage: lastMsg ? { content: lastMsg.content, senderName: lastMsg.sender?.username, senderRole: lastMsg.senderRole, messageType: lastMsg.messageType, createdAt: lastMsg.createdAt } : null,
                    unreadCount: unread,
                    updatedAt: lastMsg?.createdAt || order.createdAt
                });
            }
        }
        list.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
        res.json({ success: true, data: list });
    } catch (err) { console.error('getActiveChats', err); res.status(500).json({ success: false, message: err.message }); }
};

/**
 * Create a system message (called internally, not an HTTP endpoint)
 */
exports.createSystemMessage = async (orderId, thread, content) => {
    try {
        const msg = await Message.create({ order: orderId, chatThread: thread, sender: orderId, senderRole: 'admin', messageType: 'system', content, readBy: [] });
        try { const io = getIO(); io.to(`${orderId}:${thread}`).emit('newMessage', { ...msg.toObject(), sender: { _id: 'system', username: 'System' } }); } catch (e) { }
        return msg;
    } catch (err) { console.error('createSystemMessage', err); }
};

// ─── Legacy Endpoints (backward compat – old frontend keeps working) ────────

/**
 * @route   GET /api/chat/:orderId
 */
exports.getOrderMessages = async (req, res) => {
    try {
        const messages = await Message.find({ order: req.params.orderId }).sort({ createdAt: 1 }).populate('sender', 'name username profilePicture');
        res.json({ success: true, data: messages });
    } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

/**
 * @route   POST /api/chat/:orderId
 */
exports.sendMessage = async (req, res) => {
    try {
        const { orderId } = req.params;
        const { message, senderRole, attachments } = req.body;
        const senderId = req.user._id;

        const order = await Order.findById(orderId)
            .populate('restaurant', 'name createdBy owner')
            .populate('customer', 'username').populate('deliveryRider', 'username');
        if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

        // Auto-detect thread
        let thread = req.body.thread;
        if (!thread || !THREAD_ENUM.includes(thread)) {
            const uid = senderId.toString();
            const customerId = (order.customer?._id || order.customer || '').toString();
            const ownerId = getRestaurantOwnerId(order);
            const riderId = (order.deliveryRider?._id || order.deliveryRider || '').toString();
            const role = senderRole || req.user.role;
            if (role === 'delivery_staff' || role === 'rider' || uid === riderId) {
                thread = req.body.recipientRole === 'restaurant' ? 'restaurant-rider' : 'customer-rider';
            } else if (role === 'restaurant' || role === 'restaurant_admin' || uid === ownerId) {
                thread = (req.body.recipientRole === 'delivery_staff' || req.body.recipientRole === 'rider') ? 'restaurant-rider' : 'customer-restaurant';
            } else {
                thread = 'customer-restaurant';
            }
        }

        let resolvedRole = senderRole || req.user.role;
        if (resolvedRole === 'delivery_staff') resolvedRole = 'rider';
        if (resolvedRole === 'restaurant_admin') resolvedRole = 'restaurant';

        const newMsg = await Message.create({
            order: orderId, chatThread: thread, sender: senderId, senderRole: resolvedRole,
            messageType: 'user', content: message, attachments: attachments || [],
            readBy: [senderId]
        });
        await newMsg.populate('sender', 'name username profilePicture');

        try { const io = getIO(); io.to(orderId).emit('newMessage', newMsg); io.to(`${orderId}:${thread}`).emit('newMessage', newMsg); } catch (e) { }

        for (const rid of getRecipients(order, senderId, thread)) {
            try {
                await Notification.create({ user: rid, type: 'chat_message', title: 'New Message', message: `Message on order #${order.orderNumber || orderId.toString().slice(-6)}`, data: { orderId, thread } });
                try { const io = getIO(); io.to(rid.toString()).emit('notification', { type: 'chat_message', orderId, thread }); } catch (e) { }
            } catch (e) { }
        }

        res.status(201).json({ success: true, data: newMsg });
    } catch (err) { console.error('sendMessage', err); res.status(500).json({ success: false, message: err.message }); }
};

/**
 * @route   PUT /api/chat/:orderId/read
 */
exports.markAsRead = async (req, res) => {
    try {
        await Message.updateMany(
            { order: req.params.orderId, readBy: { $ne: req.user._id } },
            { $addToSet: { readBy: req.user._id } }
        );
        res.json({ success: true, message: 'Marked as read' });
    } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};
