const mongoose = require('mongoose');

const cartItemSchema = new mongoose.Schema({
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
  },
  addedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
});

const restaurantGroupSchema = new mongoose.Schema({
  restaurant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Restaurant',
    required: true
  },
  items: [cartItemSchema]
});

const cartSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  restaurantGroups: [restaurantGroupSchema],
  promoCode: {
    type: String
  },
  promoDiscount: {
    type: Number,
    default: 0
  },
  isShared: {
    type: Boolean,
    default: false
  },
  shareCode: {
    type: String,
    unique: true,
    sparse: true
  },
  collaborators: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }]
}, {
  timestamps: true
});

// Virtual for subtotal (across all restaurants)
cartSchema.virtual('subtotal').get(function () {
  return this.restaurantGroups.reduce((total, group) => {
    return total + group.items.reduce((groupTotal, item) => groupTotal + (item.price * item.quantity), 0);
  }, 0);
});

// Virtual for total items count
cartSchema.virtual('itemCount').get(function () {
  return this.restaurantGroups.reduce((count, group) => {
    return count + group.items.reduce((groupCount, item) => groupCount + item.quantity, 0);
  }, 0);
});

// Enable virtuals in JSON
cartSchema.set('toJSON', { virtuals: true });
cartSchema.set('toObject', { virtuals: true });

const Cart = mongoose.model('Cart', cartSchema);

module.exports = Cart;
