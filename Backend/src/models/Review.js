const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  order: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: true
  },
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  // Restaurant Review
  restaurant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Restaurant'
  },
  restaurantRating: {
    type: Number,
    min: 1,
    max: 5
  },
  foodRating: {
    type: Number,
    min: 1,
    max: 5
  },
  restaurantReview: {
    type: String
  },
  // Delivery Review
  deliveryRider: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  deliveryRating: {
    type: Number,
    min: 1,
    max: 5
  },
  deliveryReview: {
    type: String
  },
  // Menu Item Reviews
  itemReviews: [{
    menuItem: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Menu'
    },
    rating: {
      type: Number,
      min: 1,
      max: 5
    },
    comment: String
  }],
  // Overall
  overallRating: {
    type: Number,
    min: 1,
    max: 5,
    required: true
  },
  comment: {
    type: String
  },
  images: [{
    type: String
  }],
  isPublic: {
    type: Boolean,
    default: true
  },
  response: {
    text: String,
    respondedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    respondedAt: Date
  }
}, {
  timestamps: true
});

// Ensure one review per order
reviewSchema.index({ order: 1 }, { unique: true });
reviewSchema.index({ restaurant: 1, createdAt: -1 });
reviewSchema.index({ deliveryRider: 1, createdAt: -1 });

const Review = mongoose.model('Review', reviewSchema);

module.exports = Review;
