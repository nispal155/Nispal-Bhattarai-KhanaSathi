const mongoose = require('mongoose');

const complaintSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    order: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Order',
        required: false
    },
    type: {
        type: String,
        enum: ['order_issue', 'delivery_issue', 'food_quality', 'payment_issue', 'app_bug', 'other'],
        required: true
    },
    subject: {
        type: String,
        required: true,
        maxLength: 200
    },
    description: {
        type: String,
        required: true,
        maxLength: 2000
    },
    status: {
        type: String,
        enum: ['open', 'in_progress', 'resolved', 'closed'],
        default: 'open'
    },
    priority: {
        type: String,
        enum: ['low', 'medium', 'high', 'urgent'],
        default: 'medium'
    },
    assignedTo: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: false
    },
    resolution: {
        type: String,
        maxLength: 2000
    },
    attachments: [{
        url: String,
        type: String
    }],
    statusHistory: [{
        status: String,
        changedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        note: String,
        timestamp: {
            type: Date,
            default: Date.now
        }
    }]
}, { timestamps: true });

// Index for quick searching
complaintSchema.index({ user: 1, createdAt: -1 });
complaintSchema.index({ status: 1 });
complaintSchema.index({ type: 1 });

module.exports = mongoose.model('Complaint', complaintSchema);
