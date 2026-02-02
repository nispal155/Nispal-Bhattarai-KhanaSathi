const mongoose = require('mongoose');

const invoiceSchema = new mongoose.Schema({
    restaurant: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Restaurant',
        required: true
    },
    periodStart: {
        type: Date,
        required: true
    },
    periodEnd: {
        type: Date,
        required: true
    },
    totalSales: {
        type: Number,
        required: true
    },
    commissionAmount: {
        type: Number,
        required: true
    },
    netPayout: {
        type: Number,
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'paid', 'void'],
        default: 'pending'
    },
    paymentDate: {
        type: Date
    },
    transactionId: {
        type: String
    }
}, {
    timestamps: true
});

const Invoice = mongoose.model('Invoice', invoiceSchema);

module.exports = Invoice;
