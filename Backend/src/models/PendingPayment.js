const mongoose = require('mongoose');

const pendingPaymentSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  // Store cart data for order creation after payment
  cartData: {
    restaurantGroups: [{
      restaurant: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Restaurant'
      },
      items: [{
        menuItem: mongoose.Schema.Types.ObjectId,
        name: String,
        price: Number,
        quantity: Number,
        image: String,
        specialInstructions: String
      }]
    }],
    promoCode: String,
    promoDiscount: Number
  },
  deliveryAddress: {
    addressLine1: String,
    city: String,
    state: String,
    zipCode: String
  },
  paymentMethod: {
    type: String,
    enum: ['esewa', 'khalti'],
    required: true
  },
  specialInstructions: String,
  useLoyaltyPoints: {
    type: Boolean,
    default: false
  },
  // Payment tracking
  transactionId: String, // eSewa transaction UUID or Khalti pidx
  totalAmount: Number,
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'expired'],
    default: 'pending'
  },
  expiresAt: {
    type: Date,
    default: () => new Date(Date.now() + 30 * 60 * 1000) // 30 minutes expiry
  }
}, {
  timestamps: true
});

// Index for cleanup of expired payments
pendingPaymentSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('PendingPayment', pendingPaymentSchema);
