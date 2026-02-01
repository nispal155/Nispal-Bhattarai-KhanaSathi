const express = require('express');
const router = express.Router();
const { getOverviewStats, getTopRestaurants } = require('../controller/analyticsController');
const { protect, admin } = require('../middleware/authMiddleware');

// All analytics routes are protected and admin-only
router.use(protect);
router.use(admin);

router.get('/overview', getOverviewStats);
router.get('/top-restaurants', getTopRestaurants);

module.exports = router;
