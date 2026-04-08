const mongoose = require('mongoose');

const riderPaymentClaimSchema = new mongoose.Schema({
  rider: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  periodType: {
    type: String,
    enum: ['daily', 'weekly'],
    required: true
  },
  periodLabel: {
    type: String,
    required: true,
    trim: true
  },
  referenceDate: {
    type: Date,
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
  orderIds: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order'
  }],
  deliveriesCount: {
    type: Number,
    required: true,
    min: 0
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'paid', 'rejected'],
    default: 'pending'
  },
  claimedAt: {
    type: Date,
    default: Date.now
  },
  processedAt: {
    type: Date,
    default: null
  },
  adminNote: {
    type: String,
    trim: true,
    default: ''
  }
}, {
  timestamps: true
});

riderPaymentClaimSchema.index({ rider: 1, claimedAt: -1 });
riderPaymentClaimSchema.index({ rider: 1, periodType: 1, periodStart: 1, periodEnd: 1 });

module.exports = mongoose.model('RiderPaymentClaim', riderPaymentClaimSchema);
