const mongoose = require('mongoose');

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
  applicableRestaurants: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Restaurant'
  }],
  applicableCategories: [{
    type: String
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
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
  if (this.applicableRestaurants.length > 0 && !this.applicableRestaurants.includes(restaurantId)) {
    return { valid: false, message: 'Promo code not valid for this restaurant' };
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

// Note: code index is already created by unique: true
promoCodeSchema.index({ validUntil: 1 });

const PromoCode = mongoose.model('PromoCode', promoCodeSchema);

module.exports = PromoCode;
