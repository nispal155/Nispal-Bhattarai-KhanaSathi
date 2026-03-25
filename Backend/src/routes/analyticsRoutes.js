const express = require('express');
const router = express.Router();
const {
    getOverviewStats,
    getTopRestaurants,
    getForecasting,
    getSettlementStats,
    generateInvoice,
    getTransactionLogs,
    getRoutePerformance
} = require('../controller/analyticsController');
const { protect, admin } = require('../middleware/authMiddleware');

// All analytics routes are protected and admin-only
router.use(protect);
router.use(admin);

router.get('/overview', getOverviewStats);
router.get('/top-restaurants', getTopRestaurants);
router.get('/forecasting', getForecasting);
router.get('/settlements', getSettlementStats);
router.get('/transactions', getTransactionLogs);
router.get('/route-performance', getRoutePerformance);
router.post('/generate-invoice', generateInvoice);

module.exports = router;
