const mongoose = require('mongoose');

const auditLogEntrySchema = new mongoose.Schema({
  action: {
    type: String,
    enum: ['created', 'updated', 'deleted', 'toggled', 'broadcasted'],
    required: true
  },
  performedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  performedByRole: {
    type: String,
    enum: ['admin', 'restaurant'],
    required: true
  },
  changes: {
    type: mongoose.Schema.Types.Mixed
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
}, { _id: false });

const promoCodeSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true
  },
  description: {
    type: String
  },
  discountType: {
    type: String,
    enum: ['percentage', 'fixed'],
    required: true
  },
  discountValue: {
    type: Number,
    required: true,
    min: 0
  },
  minOrderAmount: {
    type: Number,
    default: 0
  },
  maxDiscount: {
    type: Number // Max discount for percentage type
  },
  validFrom: {
    type: Date,
    required: true
  },
  validUntil: {
    type: Date,
    required: true
  },
  usageLimit: {
    type: Number,
    default: null // null means unlimited
  },
  usedCount: {
    type: Number,
    default: 0
  },
  perUserLimit: {
    type: Number,
    default: 1
  },
  // === OFFER SCOPE & OWNERSHIP ===
  scope: {
    type: String,
    enum: ['global', 'restaurant'],
    default: 'global'
  },
  applicableRestaurants: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Restaurant'
  }],
  restaurant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Restaurant',
    default: null // null for global offers
  },
  applicableCategories: [{
    type: String
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  // === CREATOR TRACKING ===
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  createdByRole: {
    type: String,
    enum: ['admin', 'restaurant'],
    required: true
  },
  // === AUDIT LOG ===
  auditLog: [auditLogEntrySchema]
}, {
  timestamps: true
});

// Check if promo code is valid
promoCodeSchema.methods.isValid = function(orderAmount, restaurantId) {
  const now = new Date();
  
  if (!this.isActive) return { valid: false, message: 'Promo code is inactive' };
  if (now < this.validFrom) return { valid: false, message: 'Promo code is not yet valid' };
  if (now > this.validUntil) return { valid: false, message: 'Promo code has expired' };
  if (this.usageLimit && this.usedCount >= this.usageLimit) {
    return { valid: false, message: 'Promo code usage limit reached' };
  }
  if (orderAmount < this.minOrderAmount) {
    return { valid: false, message: `Minimum order amount is Rs. ${this.minOrderAmount}` };
  }

  // For restaurant-specific offers, check restaurant match
  if (this.scope === 'restaurant' && this.restaurant) {
    if (restaurantId && this.restaurant.toString() !== restaurantId.toString()) {
      return { valid: false, message: 'Promo code not valid for this restaurant' };
    }
  }

  // For global offers with selected restaurants
  if (this.applicableRestaurants.length > 0 && restaurantId) {
    const applicable = this.applicableRestaurants.map(r => r.toString());
    if (!applicable.includes(restaurantId.toString())) {
      return { valid: false, message: 'Promo code not valid for this restaurant' };
    }
  }
  
  return { valid: true };
};

// Calculate discount
promoCodeSchema.methods.calculateDiscount = function(orderAmount) {
  let discount = 0;
  
  if (this.discountType === 'percentage') {
    discount = (orderAmount * this.discountValue) / 100;
    if (this.maxDiscount && discount > this.maxDiscount) {
      discount = this.maxDiscount;
    }
  } else {
    discount = this.discountValue;
  }
  
  return Math.min(discount, orderAmount);
};

promoCodeSchema.index({ validUntil: 1 });
promoCodeSchema.index({ scope: 1, restaurant: 1 });
promoCodeSchema.index({ createdBy: 1, createdByRole: 1 });

const PromoCode = mongoose.model('PromoCode', promoCodeSchema);

module.exports = PromoCode;
