const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
    order: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Order',
        required: true
    },
    chatThread: {
        type: String,
        enum: ['customer-restaurant', 'customer-rider', 'restaurant-rider'],
        required: true
    },
    sender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    senderRole: {
        type: String,
        enum: ['customer', 'restaurant', 'rider', 'delivery_staff', 'admin'],
        required: true
    },
    messageType: {
        type: String,
        enum: ['user', 'system'],
        default: 'user'
    },
    content: {
        type: String,
        required: true
    },
    attachments: [{
        type: String
    }],
    readBy: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }]
}, {
    timestamps: true
});

// Index for performance
messageSchema.index({ order: 1, chatThread: 1, createdAt: 1 });

const Message = mongoose.model('Message', messageSchema);

module.exports = Message;
