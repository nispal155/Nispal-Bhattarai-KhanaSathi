const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  menuItem: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Menu',
    required: true
  },
  name: {
    type: String,
    required: true
  },
  price: {
    type: Number,
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 1
  },
  specialInstructions: {
    type: String
  }
});

const orderSchema = new mongoose.Schema({
  orderNumber: {
    type: String,
    unique: true
  },
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  restaurant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Restaurant',
    required: true
  },
  items: [orderItemSchema],
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'preparing', 'ready', 'picked_up', 'on_the_way', 'delivered', 'cancelled'],
    default: 'pending'
  },
  deliveryAddress: {
    label: String,
    addressLine1: String,
    addressLine2: String,
    city: String,
    state: String,
    zipCode: String,
    coordinates: {
      lat: Number,
      lng: Number
    }
  },
  deliveryRider: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  pricing: {
    subtotal: {
      type: Number,
      required: true
    },
    deliveryFee: {
      type: Number,
      default: 50
    },
    serviceFee: {
      type: Number,
      default: 20
    },
    discount: {
      type: Number,
      default: 0
    },
    total: {
      type: Number,
      required: true
    }
  },
  paymentMethod: {
    type: String,
    enum: ['esewa', 'khalti', 'card', 'bank', 'cod'],
    default: 'cod'
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'failed', 'refunded'],
    default: 'pending'
  },
  // eSewa payment tracking
  esewaTransactionId: {
    type: String
  },
  esewaRefId: {
    type: String
  },
  // Khalti payment tracking
  khaltiPidx: {
    type: String
  },
  khaltiRefId: {
    type: String
  },
  specialInstructions: {
    type: String
  },
  estimatedDeliveryTime: {
    type: Date
  },
  actualDeliveryTime: {
    type: Date
  },
  statusHistory: [{
    status: String,
    timestamp: {
      type: Date,
      default: Date.now
    },
    note: String
  }],
  promoCode: {
    type: String
  },
  isRated: {
    type: Boolean,
    default: false
  },
  sosStatus: {
    type: String,
    enum: ['none', 'active', 'resolved'],
    default: 'none'
  },
  riderLocationHistory: [{
    lat: Number,
    lng: Number,
    timestamp: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true
});

// Generate order number before saving
orderSchema.pre('save', async function () {
  if (!this.orderNumber) {
    const year = new Date().getFullYear();
    const count = await this.constructor.countDocuments();
    this.orderNumber = `KS-${year}-${String(count + 1).padStart(4, '0')}`;
  }
  // Add status to history when status changes
  if (this.isModified('status')) {
    this.statusHistory.push({
      status: this.status,
      timestamp: new Date()
    });
  }
});

// Index for queries
orderSchema.index({ customer: 1, createdAt: -1 });
orderSchema.index({ restaurant: 1, status: 1 });
orderSchema.index({ deliveryRider: 1, status: 1 });
// Note: orderNumber index is already created by unique: true

const Order = mongoose.model('Order', orderSchema);

module.exports = Order;
