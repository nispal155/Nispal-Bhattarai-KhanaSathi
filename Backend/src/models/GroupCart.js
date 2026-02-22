const mongoose = require('mongoose');
const crypto = require('crypto');

const memberItemSchema = new mongoose.Schema({
  menuItem: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Menu',
    required: true
  },
  restaurant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Restaurant',
    required: true
  },
  restaurantName: {
    type: String
  },
  name: {
    type: String,
    required: true
  },
  price: {
    type: Number,
    required: true
  },
  image: {
    type: String
  },
  quantity: {
    type: Number,
    required: true,
    min: 1,
    default: 1
  },
  specialInstructions: {
    type: String
  }
});

const memberSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  role: {
    type: String,
    enum: ['host', 'member'],
    default: 'member'
  },
  items: [memberItemSchema],
  isReady: {
    type: Boolean,
    default: false
  },
  paymentStatus: {
    type: String,
    enum: ['none', 'pending', 'paid'],
    default: 'none'
  },
  paymentAmount: {
    type: Number,
    default: 0
  },
  paymentMethod: {
    type: String,
    enum: ['cod', 'esewa', 'khalti', ''],
    default: ''
  },
  paymentRef: {
    type: String
  },
  joinedAt: {
    type: Date,
    default: Date.now
  }
});

// Virtual: member subtotal
memberSchema.virtual('subtotal').get(function () {
  return this.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
});

memberSchema.set('toJSON', { virtuals: true });
memberSchema.set('toObject', { virtuals: true });

const groupCartSchema = new mongoose.Schema({
  name: {
    type: String,
    default: 'Group Order'
  },
  host: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  inviteCode: {
    type: String,
    unique: true,
    default: () => crypto.randomBytes(4).toString('hex').toUpperCase()
  },
  members: [memberSchema],
  status: {
    type: String,
    enum: ['open', 'locked', 'payment_pending', 'ordered', 'cancelled'],
    default: 'open'
  },
  maxMembers: {
    type: Number,
    default: 10
  },
  splitMode: {
    type: String,
    enum: ['individual', 'equal', 'host_pays'],
    default: 'individual'
  },
  paymentMethod: {
    type: String,
    enum: ['cod', 'esewa', 'khalti', ''],
    default: ''
  },
  deliveryAddress: {
    addressLine1: String,
    addressLine2: String,
    city: String,
    state: String,
    zipCode: String
  },
  promoCode: {
    type: String
  },
  promoDiscount: {
    type: Number,
    default: 0
  },
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order'
  },
  expiresAt: {
    type: Date,
    default: () => new Date(Date.now() + 2 * 60 * 60 * 1000) // 2 hours
  }
}, {
  timestamps: true
});

// Virtual: total across all members
groupCartSchema.virtual('total').get(function () {
  return this.members.reduce((sum, member) => {
    return sum + member.items.reduce((s, item) => s + item.price * item.quantity, 0);
  }, 0);
});

// Virtual: total item count
groupCartSchema.virtual('itemCount').get(function () {
  return this.members.reduce((count, member) => {
    return count + member.items.reduce((c, item) => c + item.quantity, 0);
  }, 0);
});

// Virtual: all members ready
groupCartSchema.virtual('allReady').get(function () {
  return this.members.length > 0 && this.members.every(m => m.isReady);
});

// Virtual: all members paid
groupCartSchema.virtual('allPaid').get(function () {
  if (this.splitMode === 'host_pays') {
    const host = this.members.find(m => m.role === 'host');
    return host?.paymentStatus === 'paid';
  }
  return this.members.length > 0 && this.members.every(m => m.paymentStatus === 'paid');
});

// Indexes (inviteCode already has `unique: true` on the field itself)
groupCartSchema.index({ host: 1, status: 1 });
groupCartSchema.index({ 'members.user': 1, status: 1 });
groupCartSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // TTL auto-cleanup

groupCartSchema.set('toJSON', { virtuals: true });
groupCartSchema.set('toObject', { virtuals: true });

const GroupCart = mongoose.model('GroupCart', groupCartSchema);

module.exports = GroupCart;
