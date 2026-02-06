const socketio = require('socket.io');

const Message = require('../models/Message');

let io;

const init = (server) => {
    io = socketio(server, {
        cors: {
            origin: "*",
            methods: ["GET", "POST"]
        }
    });

    io.on('connection', (socket) => {
        console.log(`New connection: ${socket.id}`);

        // Join a room – supports orderId, `orderId:thread`, or userId
        socket.on('join', (roomId) => {
            socket.join(roomId);
            console.log(`Socket ${socket.id} joined room ${roomId}`);
        });

        // Alias: joinOrder (used by order-tracking page)
        socket.on('joinOrder', (orderId) => {
            socket.join(orderId);
            console.log(`Socket ${socket.id} joined order room ${orderId}`);
        });

        // Leave a room
        socket.on('leave', (roomId) => {
            socket.leave(roomId);
            console.log(`Socket ${socket.id} left room ${roomId}`);
        });

        // Rider location broadcast – rider emits, customer receives
        socket.on('riderLocation', ({ orderId, lat, lng }) => {
            if (orderId && lat != null && lng != null) {
                socket.to(orderId).emit('riderLocation', { orderId, lat, lng });
            }
        });

        // Chat functionality (legacy – kept for backward compat)
        socket.on('sendMessage', async (data) => {
            const { orderId, senderId, senderRole, content, attachments, thread } = data;

            try {
                // Determine chatThread
                const chatThread = thread || 'customer-restaurant';

                const message = await Message.create({
                    order: orderId,
                    chatThread,
                    sender: senderId,
                    senderRole,
                    messageType: 'user',
                    content,
                    attachments,
                    readBy: [senderId]
                });

                // Broadcast to both legacy room and thread room
                io.to(orderId).emit('newMessage', message);
                if (thread) {
                    io.to(`${orderId}:${thread}`).emit('newMessage', message);
                }

                // Notifications
                const Notification = require('../models/Notification');
                const Order = require('../models/Order');
                const order = await Order.findById(orderId);

                if (order) {
                    let receiverId;
                    if (senderRole === 'customer') {
                        receiverId = order.restaurant;
                    } else {
                        receiverId = order.customer;
                    }

                    if (receiverId) {
                        await Notification.create({
                            user: receiverId,
                            type: 'chat_message',
                            title: 'New Message',
                            message: `You have a new message regarding order #${orderId.toString().slice(-6)}`,
                            data: { orderId, chatId: orderId }
                        });
                    }
                }

            } catch (error) {
                console.error('Chat error:', error);
                socket.emit('error', { message: 'Failed to send message' });
            }
        });

        // Typing indicator – relay to room
        socket.on('typing', ({ roomId, userId, username }) => {
            socket.to(roomId).emit('typing', { userId, username });
        });

        socket.on('stopTyping', ({ roomId, userId }) => {
            socket.to(roomId).emit('stopTyping', { userId });
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
    if (io) {
        io.to(orderId).emit('orderStatusUpdate', { orderId, status, ...data });

        // If a rider was just assigned, emit a dedicated event so the tracking page updates the rider card
        if (data?.rider) {
            io.to(orderId).emit('riderAssigned', { orderId, rider: data.rider });
        }
    }
};

module.exports = {
    init,
    getIO,
    emitOrderUpdate
};
