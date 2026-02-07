const socketio = require('socket.io');
const jwt = require('jsonwebtoken');
const Message = require('../models/Message');
const User = require('../models/User');

let io;

const init = (server) => {
    io = socketio(server, {
        cors: {
            origin: process.env.FRONTEND_URL || "http://localhost:3000",
            methods: ["GET", "POST"],
            credentials: true
        }
    });

    // JWT authentication middleware for socket connections
    io.use(async (socket, next) => {
        try {
            const token = socket.handshake.auth?.token || socket.handshake.query?.token;
            if (!token) {
                socket.user = null;
                return next();
            }

            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            const user = await User.findById(decoded.id).select('_id username role isOnline');
            if (!user) {
                return next(new Error('User not found'));
            }

            socket.user = user;
            next();
        } catch (err) {
            socket.user = null;
            next();
        }
    });

    io.on('connection', (socket) => {
        const userId = socket.user?._id?.toString();
        console.log(`New connection: ${socket.id}${userId ? ` (user: ${userId})` : ' (guest)'}`);

        // Automatically join user's personal room for notifications
        if (userId) {
            socket.join(userId);
        }

        // Join a room – supports orderId, `orderId:thread`, or userId
        socket.on('join', (roomId) => {
            if (!roomId) return;
            const target = roomId.toString();
            socket.join(target);
            console.log(`Socket ${socket.id} joined room ${target}`);
        });

        // Alias: joinOrder (used by order-tracking page)
        socket.on('joinOrder', (orderId) => {
            if (!orderId) return;
            const target = orderId.toString();
            socket.join(target);
            console.log(`Socket ${socket.id} joined order room ${target}`);
        });

        // Leave a room
        socket.on('leave', (roomId) => {
            if (!roomId) return;
            socket.leave(roomId);
        });

        // Rider location broadcast – rider emits, customer receives
        socket.on('riderLocation', ({ orderId, lat, lng }) => {
            if (orderId && lat != null && lng != null) {
                socket.to(orderId).emit('riderLocation', { orderId, lat, lng });
            }
        });

        // Chat functionality
        socket.on('sendMessage', async (data) => {
            if (!socket.user) {
                socket.emit('error', { message: 'Authentication required to send messages' });
                return;
            }

            const { orderId, content, attachments, thread } = data;

            if (!orderId || !content) {
                socket.emit('error', { message: 'orderId and content are required' });
                return;
            }

            try {
                const chatThread = thread || 'customer-restaurant';

                const message = await Message.create({
                    order: orderId,
                    chatThread,
                    sender: socket.user._id,
                    senderRole: socket.user.role,
                    messageType: 'user',
                    content,
                    attachments,
                    readBy: [socket.user._id]
                });

                const populatedMessage = await Message.findById(message._id)
                    .populate('sender', 'username profilePicture role');

                const room = `${orderId.toString()}:${chatThread}`;
                io.to(room).emit('newMessage', populatedMessage);
                io.to(orderId.toString()).emit('newMessage', populatedMessage);

                // Create notifications for other parties
                const Notification = require('../models/Notification');
                const Order = require('../models/Order');
                const MultiOrder = require('../models/MultiOrder');
                let order = await Order.findById(orderId);

                if (!order) {
                    order = await MultiOrder.findById(orderId);
                }

                if (order) {
                    let receiverId;
                    if (chatThread === 'customer-restaurant') {
                        if (socket.user.role === 'customer') {
                            const Restaurant = require('../models/Restaurant');
                            const restaurant = await Restaurant.findById(order.restaurant);
                            receiverId = restaurant?.createdBy || restaurant?.owner;
                        } else {
                            receiverId = order.customer;
                        }
                    } else if (chatThread === 'customer-rider') {
                        if (socket.user.role === 'customer') {
                            receiverId = order.deliveryRider || order.primaryRider;
                        } else {
                            receiverId = order.customer;
                        }
                    } else if (chatThread === 'restaurant-rider') {
                        const ownerId = order.restaurant?.createdBy || order.restaurant?.owner || order.restaurant;
                        if (socket.user._id.toString() === (ownerId?.toString() || '')) {
                            receiverId = order.deliveryRider || order.primaryRider;
                        } else {
                            receiverId = ownerId;
                        }
                    }

                    if (receiverId) {
                        const notifData = {
                            user: receiverId,
                            type: 'chat_message',
                            title: 'New Message',
                            message: `New message regarding order #${order.orderNumber || orderId.toString().slice(-6)}`,
                            data: { orderId, chatId: orderId, thread: chatThread }
                        };

                        await Notification.create(notifData);

                        io.to(receiverId.toString()).emit('notification', {
                            type: 'chat_message',
                            title: notifData.title,
                            message: notifData.message,
                            orderId,
                            thread: chatThread
                        });
                    }
                }
            } catch (error) {
                console.error('Chat error:', error);
                socket.emit('error', { message: 'Failed to send message' });
            }
        });

        // Mark messages as read
        socket.on('markRead', async ({ orderId, thread }) => {
            if (!socket.user || !orderId) return;

            try {
                await Message.updateMany(
                    {
                        order: orderId,
                        chatThread: thread || 'customer-restaurant',
                        readBy: { $ne: socket.user._id }
                    },
                    { $addToSet: { readBy: socket.user._id } }
                );
            } catch (error) {
                console.error('Mark read error:', error);
            }
        });

        // Typing indicator
        socket.on('typing', ({ roomId, userId, username }) => {
            socket.to(roomId).emit('typing', { userId: userId || socket.user?._id, username: username || socket.user?.username });
        });

        socket.on('stopTyping', ({ roomId, userId }) => {
            socket.to(roomId).emit('stopTyping', { userId: userId || socket.user?._id });
        });

        socket.on('disconnect', () => {
            console.log(`Socket disconnected: ${socket.id}`);
        });
    });

    return io;
};

const getIO = () => {
    if (!io) {
        throw new Error('Socket.io not initialized!');
    }
    return io;
};

// Helper to emit order updates
const emitOrderUpdate = (orderId, status, data) => {
    if (io && orderId) {
        const target = orderId.toString();
        io.to(target).emit('orderStatusUpdate', { orderId: target, status, ...data });

        // If rider is assigned, notify their personal room for real-time dashboard refresh
        if (data?.rider) {
            const riderId = (data.rider._id || data.rider).toString();
            io.to(riderId).emit('riderAssigned', { orderId: target, status, ...data });
            console.log(`[Socket] Notified rider ${riderId} about assignment to order ${target}`);
        }
    }
};

// Helper to send notification to a specific user
const sendNotification = (userId, notification) => {
    if (io && userId) {
        io.to(userId.toString()).emit('notification', notification);
    }
};

module.exports = {
    init,
    getIO,
    emitOrderUpdate,
    sendNotification
};
