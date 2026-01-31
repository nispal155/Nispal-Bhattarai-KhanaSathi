const Review = require('../models/Review');
const Order = require('../models/Order');
const Restaurant = require('../models/Restaurant');
const User = require('../models/User');
const Menu = require('../models/Menu');

/**
 * @desc    Create a review for an order
 * @route   POST /api/reviews
 * @access  Private (Customer)
 */
exports.createReview = async (req, res) => {
  try {
    const {
      orderId,
      restaurantRating,
      foodRating,
      restaurantReview,
      deliveryRating,
      deliveryReview,
      itemReviews,
      overallRating,
      comment,
      images
    } = req.body;

    // Check if order exists and belongs to user
    const order = await Order.findOne({
      _id: orderId,
      customer: req.user._id,
      status: 'delivered'
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found or not eligible for review'
      });
    }

    // Check if already reviewed
    const existingReview = await Review.findOne({ order: orderId });
    if (existingReview) {
      return res.status(400).json({
        success: false,
        message: 'Order has already been reviewed'
      });
    }

    // Create review
    const review = await Review.create({
      order: orderId,
      customer: req.user._id,
      restaurant: order.restaurant,
      restaurantRating,
      foodRating,
      restaurantReview,
      deliveryRider: order.deliveryRider,
      deliveryRating,
      deliveryReview,
      itemReviews,
      overallRating,
      comment,
      images
    });

    // Update order as rated
    order.isRated = true;
    await order.save();

    // Update restaurant average rating
    await updateRestaurantRating(order.restaurant);

    // Update rider rating if applicable
    if (order.deliveryRider && deliveryRating) {
      await updateRiderRating(order.deliveryRider);
    }

    // Update menu item ratings
    if (itemReviews && itemReviews.length > 0) {
      for (const itemReview of itemReviews) {
        await updateMenuItemRating(itemReview.menuItem);
      }
    }

    res.status(201).json({
      success: true,
      message: 'Review submitted successfully',
      data: review
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to create review',
      error: error.message
    });
  }
};

/**
 * @desc    Get reviews for a restaurant
 * @route   GET /api/reviews/restaurant/:restaurantId
 * @access  Public
 */
exports.getRestaurantReviews = async (req, res) => {
  try {
    const { restaurantId } = req.params;
    const { limit = 10, page = 1, sort = '-createdAt' } = req.query;

    const reviews = await Review.find({ 
      restaurant: restaurantId,
      isPublic: true 
    })
      .populate('customer', 'username profilePicture')
      .sort(sort)
      .limit(Number(limit))
      .skip((Number(page) - 1) * Number(limit));

    const total = await Review.countDocuments({ restaurant: restaurantId, isPublic: true });

    // Calculate rating breakdown
    const ratingBreakdown = await Review.aggregate([
      { $match: { restaurant: restaurantId, isPublic: true } },
      {
        $group: {
          _id: '$overallRating',
          count: { $sum: 1 }
        }
      }
    ]);

    res.status(200).json({
      success: true,
      count: reviews.length,
      total,
      pages: Math.ceil(total / limit),
      ratingBreakdown,
      data: reviews
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch reviews',
      error: error.message
    });
  }
};

/**
 * @desc    Get reviews for a delivery rider
 * @route   GET /api/reviews/rider/:riderId
 * @access  Public
 */
exports.getRiderReviews = async (req, res) => {
  try {
    const { riderId } = req.params;
    const { limit = 10, page = 1 } = req.query;

    const reviews = await Review.find({ 
      deliveryRider: riderId,
      deliveryRating: { $exists: true },
      isPublic: true 
    })
      .populate('customer', 'username')
      .select('deliveryRating deliveryReview createdAt')
      .sort({ createdAt: -1 })
      .limit(Number(limit))
      .skip((Number(page) - 1) * Number(limit));

    const total = await Review.countDocuments({ 
      deliveryRider: riderId,
      deliveryRating: { $exists: true },
      isPublic: true 
    });

    res.status(200).json({
      success: true,
      count: reviews.length,
      total,
      data: reviews
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch rider reviews',
      error: error.message
    });
  }
};

/**
 * @desc    Get user's reviews
 * @route   GET /api/reviews/my-reviews
 * @access  Private
 */
exports.getMyReviews = async (req, res) => {
  try {
    const reviews = await Review.find({ customer: req.user._id })
      .populate('restaurant', 'name logoUrl')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: reviews.length,
      data: reviews
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch reviews',
      error: error.message
    });
  }
};

/**
 * @desc    Respond to a review (Restaurant Manager)
 * @route   PUT /api/reviews/:id/respond
 * @access  Private (Restaurant Manager)
 */
exports.respondToReview = async (req, res) => {
  try {
    const { text } = req.body;

    const review = await Review.findById(req.params.id);

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }

    // Verify restaurant ownership
    const restaurant = await Restaurant.findOne({
      _id: review.restaurant,
      createdBy: req.user._id
    });

    if (!restaurant) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to respond to this review'
      });
    }

    review.response = {
      text,
      respondedBy: req.user._id,
      respondedAt: new Date()
    };

    await review.save();

    res.status(200).json({
      success: true,
      message: 'Response added successfully',
      data: review
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to respond to review',
      error: error.message
    });
  }
};

/**
 * @desc    Delete a review
 * @route   DELETE /api/reviews/:id
 * @access  Private
 */
exports.deleteReview = async (req, res) => {
  try {
    const review = await Review.findOne({
      _id: req.params.id,
      customer: req.user._id
    });

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found or not authorized'
      });
    }

    await review.deleteOne();

    // Update ratings
    await updateRestaurantRating(review.restaurant);
    if (review.deliveryRider) {
      await updateRiderRating(review.deliveryRider);
    }

    res.status(200).json({
      success: true,
      message: 'Review deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to delete review',
      error: error.message
    });
  }
};

// Helper function to update restaurant rating
async function updateRestaurantRating(restaurantId) {
  const result = await Review.aggregate([
    { $match: { restaurant: restaurantId } },
    {
      $group: {
        _id: null,
        averageRating: { $avg: '$overallRating' },
        count: { $sum: 1 }
      }
    }
  ]);

  if (result.length > 0) {
    await Restaurant.findByIdAndUpdate(restaurantId, {
      averageRating: Math.round(result[0].averageRating * 10) / 10,
      reviewCount: result[0].count
    });
  }
}

// Helper function to update rider rating
async function updateRiderRating(riderId) {
  const result = await Review.aggregate([
    { $match: { deliveryRider: riderId, deliveryRating: { $exists: true } } },
    {
      $group: {
        _id: null,
        averageRating: { $avg: '$deliveryRating' },
        count: { $sum: 1 }
      }
    }
  ]);

  if (result.length > 0) {
    await User.findByIdAndUpdate(riderId, {
      averageRating: Math.round(result[0].averageRating * 10) / 10
    });
  }
}

// Helper function to update menu item rating
async function updateMenuItemRating(menuItemId) {
  const result = await Review.aggregate([
    { $unwind: '$itemReviews' },
    { $match: { 'itemReviews.menuItem': menuItemId } },
    {
      $group: {
        _id: null,
        averageRating: { $avg: '$itemReviews.rating' },
        count: { $sum: 1 }
      }
    }
  ]);

  if (result.length > 0) {
    await Menu.findByIdAndUpdate(menuItemId, {
      'ratings.average': Math.round(result[0].averageRating * 10) / 10,
      'ratings.count': result[0].count
    });
  }
}
