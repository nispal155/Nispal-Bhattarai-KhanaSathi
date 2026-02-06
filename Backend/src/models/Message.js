const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
    order: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Order',
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
    content: {
        type: String,
        required: true
    },
    attachments: [{
        type: String // URL to images or files
    }],
    isRead: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

// Index for performance
messageSchema.index({ order: 1, createdAt: 1 });

const Message = mongoose.model('Message', messageSchema);

module.exports = Message;
