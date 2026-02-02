const Order = require('../models/Order');
const User = require('../models/User');
const Restaurant = require('../models/Restaurant');
const Invoice = require('../models/Invoice');

/**
 * @desc    Get overview analytics stats
 * @route   GET /api/analytics/overview
 * @access  Private/Admin
 */
exports.getOverviewStats = async (req, res) => {
    try {
        const { days = 7 } = req.query;
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - parseInt(days));

        const endDate = new Date();
        const prevPeriodStartDate = new Date();
        prevPeriodStartDate.setDate(prevPeriodStartDate.getDate() - (parseInt(days) * 2));

        // Current period stats
        const currentStats = await Order.aggregate([
            {
                $match: {
                    createdAt: { $gte: startDate },
                    status: { $ne: 'cancelled' }
                }
            },
            {
                $group: {
                    _id: null,
                    totalOrders: { $sum: 1 },
                    totalRevenue: { $sum: '$pricing.total' },
                    avgOrderValue: { $avg: '$pricing.total' }
                }
            }
        ]);

        // Previous period stats for comparison
        const prevStats = await Order.aggregate([
            {
                $match: {
                    createdAt: { $gte: prevPeriodStartDate, $lt: startDate },
                    status: { $ne: 'cancelled' }
                }
            },
            {
                $group: {
                    _id: null,
                    totalOrders: { $sum: 1 },
                    totalRevenue: { $sum: '$pricing.total' }
                }
            }
        ]);

        // Active delivery staff
        const activeStaff = await User.countDocuments({
            role: 'delivery_staff',
            isOnline: true
        });

        const current = currentStats[0] || { totalOrders: 0, totalRevenue: 0, avgOrderValue: 0 };
        const previous = prevStats[0] || { totalOrders: 0, totalRevenue: 0 };

        // Calculate percentage changes
        const calcChange = (curr, prev) => {
            if (prev === 0) return curr > 0 ? 100 : 0;
            return ((curr - prev) / prev) * 100;
        };

        res.status(200).json({
            success: true,
            data: {
                totalOrders: {
                    value: current.totalOrders,
                    change: calcChange(current.totalOrders, previous.totalOrders)
                },
                totalRevenue: {
                    value: current.totalRevenue,
                    change: calcChange(current.totalRevenue, previous.totalRevenue)
                },
                avgOrderValue: {
                    value: Math.round(current.avgOrderValue),
                    change: 0 // Simplification: not tracking change for avg value here
                },
                activeStaff: {
                    value: activeStaff,
                    change: 0 // Simplification
                }
            }
        });
    } catch (error) {
        console.error('Analytics Overview Error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch analytics overview',
            error: error.message
        });
    }
};

/**
 * @desc    Get top performing restaurants
 * @route   GET /api/analytics/top-restaurants
 * @access  Private/Admin
 */
exports.getTopRestaurants = async (req, res) => {
    try {
        const { days = 7, limit = 5 } = req.query;
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - parseInt(days));

        const topRestaurants = await Order.aggregate([
            {
                $match: {
                    createdAt: { $gte: startDate },
                    status: 'delivered'
                }
            },
            {
                $group: {
                    _id: '$restaurant',
                    totalSales: { $sum: '$pricing.total' },
                    orderCount: { $sum: 1 }
                }
            },
            { $sort: { totalSales: -1 } },
            { $limit: parseInt(limit) },
            {
                $lookup: {
                    from: 'restaurants',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'restaurantData'
                }
            },
            { $unwind: '$restaurantData' },
            {
                $project: {
                    _id: 1,
                    name: '$restaurantData.name',
                    totalSales: 1,
                    orderCount: 1
                }
            }
        ]);

        res.status(200).json({
            success: true,
            data: topRestaurants
        });
    } catch (error) {
        console.error('Analytics Top Restaurants Error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch top restaurants',
            error: error.message
        });
    }
};

/**
 * @desc    Get sales forecasting (next 7 days)
 * @route   GET /api/analytics/forecasting
 * @access  Private/Admin
 */
exports.getForecasting = async (req, res) => {
    try {
        const daysToForecast = 7;
        const historicalDays = 30;
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - historicalDays);

        // Get daily sales for the last 30 days
        const dailySales = await Order.aggregate([
            {
                $match: {
                    createdAt: { $gte: startDate },
                    status: 'delivered'
                }
            },
            {
                $group: {
                    _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
                    sales: { $sum: '$pricing.total' }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        // Simple Linear Regression calculation
        const n = dailySales.length;
        if (n < 2) {
            return res.json({ success: true, data: [], message: 'Not enough data for forecasting' });
        }

        let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;
        dailySales.forEach((d, i) => {
            sumX += i;
            sumY += d.sales;
            sumXY += i * d.sales;
            sumXX += i * i;
        });

        const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
        const intercept = (sumY - slope * sumX) / n;

        // Generate next 7 days
        const forecast = [];
        const lastDate = dailySales.length > 0 ? new Date(dailySales[dailySales.length - 1]._id) : new Date();

        for (let i = 1; i <= daysToForecast; i++) {
            const forecastDate = new Date(lastDate);
            forecastDate.setDate(forecastDate.getDate() + i);
            const predictedSales = Math.max(0, slope * (n + i - 1) + intercept);

            forecast.push({
                date: forecastDate.toISOString().split('T')[0],
                predictedSales: Math.round(predictedSales)
            });
        }

        res.status(200).json({
            success: true,
            data: {
                historical: dailySales,
                forecast
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

/**
 * @desc    Get financial settlement stats
 * @route   GET /api/analytics/settlements
 * @access  Private/Admin
 */
exports.getSettlementStats = async (req, res) => {
    try {
        const stats = await Invoice.aggregate([
            {
                $group: {
                    _id: '$status',
                    count: { $sum: 1 },
                    totalAmount: { $sum: '$netPayout' }
                }
            }
        ]);

        const pendingPayouts = await Order.aggregate([
            { $match: { status: 'delivered', paymentStatus: 'paid' } },
            { $group: { _id: null, total: { $sum: '$pricing.subtotal' } } }
        ]);

        res.status(200).json({
            success: true,
            data: {
                invoices: stats,
                unbilledSales: pendingPayouts[0]?.total || 0
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

/**
 * @desc    Generate invoice for a restaurant
 * @route   POST /api/analytics/generate-invoice
 * @access  Private/Admin
 */
exports.generateInvoice = async (req, res) => {
    try {
        const { restaurantId, periodStart, periodEnd } = req.body;
        const commissionRate = 0.1; // 10% commission

        // sum all delivered orders for this restaurant in this period
        const salesData = await Order.aggregate([
            {
                $match: {
                    restaurant: new mongoose.Types.ObjectId(restaurantId),
                    status: 'delivered',
                    createdAt: { $gte: new Date(periodStart), $lte: new Date(periodEnd) }
                }
            },
            {
                $group: {
                    _id: null,
                    totalSales: { $sum: '$pricing.subtotal' }
                }
            }
        ]);

        if (!salesData.length) {
            return res.status(404).json({ success: false, message: 'No sales found for this period' });
        }

        const totalSales = salesData[0].totalSales;
        const commissionAmount = totalSales * commissionRate;
        const netPayout = totalSales - commissionAmount;

        const invoice = await Invoice.create({
            restaurant: restaurantId,
            periodStart,
            periodEnd,
            totalSales,
            commissionAmount,
            netPayout
        });

        res.status(201).json({
            success: true,
            message: 'Invoice generated successfully',
            data: invoice
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};
