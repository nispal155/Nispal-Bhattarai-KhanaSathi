const express = require('express');
const router = express.Router();
const {
  createReview,
  getRestaurantReviews,
  getRiderReviews,
  getMyReviews,
  respondToReview,
  deleteReview
} = require('../controller/reviewController');
const { protect } = require('../middleware/authMiddleware');

// Public routes
router.get('/restaurant/:restaurantId', getRestaurantReviews);
router.get('/rider/:riderId', getRiderReviews);

// Protected routes
router.post('/', protect, createReview);
router.get('/my-reviews', protect, getMyReviews);
router.put('/:id/respond', protect, respondToReview);
router.delete('/:id', protect, deleteReview);

module.exports = router;
