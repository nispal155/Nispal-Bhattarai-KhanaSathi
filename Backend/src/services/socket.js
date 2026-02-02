const socketio = require('socket.io');

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

        // Join a room based on user ID or order ID
        socket.on('join', (roomId) => {
            socket.join(roomId);
            console.log(`Socket ${socket.id} joined room ${roomId}`);
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
