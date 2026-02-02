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

        // Join a room based on ID (could be orderId or userId)
        socket.on('join', (roomId) => {
            socket.join(roomId);
            console.log(`Socket ${socket.id} joined room ${roomId}`);
        });

        // Chat functionality
        socket.on('sendMessage', async (data) => {
            const { orderId, senderId, senderRole, content, attachments } = data;

            try {
                // Persist message to DB
                const message = await Message.create({
                    order: orderId,
                    sender: senderId,
                    senderRole,
                    content,
                    attachments
                });

                // Broadcast to everyone in the room (including sender to confirm receipt)
                io.to(orderId).emit('newMessage', message);

                // Persist notification for the receiver
                const Notification = require('../models/Notification');
                const Order = require('../models/Order');
                const order = await Order.findById(orderId);

                if (order) {
                    // Determine receiver based on senderRole
                    let receiverId;
                    if (senderRole === 'customer') {
                        // Notify restaurant or delivery staff? Usually both or context dependent.
                        // For simplicity, notify the restaurant owner.
                        receiverId = order.restaurant;
                    } else {
                        // Notify customer
                        receiverId = order.user;
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

                // Also emit a notification event for the receiver if they are not in the room
                io.emit('notification', {
                    type: 'chat',
                    orderId,
                    message: `New message from ${senderRole}`
                });

            } catch (error) {
                console.error('Chat error:', error);
                socket.emit('error', { message: 'Failed to send message' });
            }
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
        io.to(orderId).emit('orderStatusUpdate', { orderId, status, data });
    }
};

module.exports = {
    init,
    getIO,
    emitOrderUpdate
};
