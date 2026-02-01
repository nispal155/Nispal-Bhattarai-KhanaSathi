const Order = require('../models/Order');
const User = require('../models/User');
const Restaurant = require('../models/Restaurant');

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
