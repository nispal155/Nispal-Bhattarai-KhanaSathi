const mongoose = require('mongoose');
const Order = require('../models/Order');
const User = require('../models/User');
const Restaurant = require('../models/Restaurant');
const Invoice = require('../models/Invoice');
const PendingPayment = require('../models/PendingPayment');
const Message = require('../models/Message');
const SupportTicket = require('../models/SupportTicket');
const { ensureSystemSettings } = require('../utils/systemSettings');

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

        // Active restaurants
        const activeRestaurants = await Restaurant.countDocuments({ isActive: true });

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
                },
                activeRestaurants: {
                    value: activeRestaurants,
                    change: 0
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
 * @desc    Get payment gateway summary and transaction logs
 * @route   GET /api/analytics/transactions
 * @access  Private/Admin
 */
exports.getTransactionLogs = async (req, res) => {
    try {
        const settings = await ensureSystemSettings();

        const [
            recentOrders,
            recentPendingPayments,
            paidInvoices,
            orderGatewayCounts
        ] = await Promise.all([
            Order.find({})
                .populate('customer', 'username')
                .populate('restaurant', 'name')
                .sort({ createdAt: -1 })
                .limit(25),
            PendingPayment.find({})
                .populate('user', 'username')
                .sort({ createdAt: -1 })
                .limit(10),
            Invoice.countDocuments({ status: 'paid' }),
            Order.aggregate([
                {
                    $group: {
                        _id: '$paymentMethod',
                        paidCount: {
                            $sum: {
                                $cond: [{ $eq: ['$paymentStatus', 'paid'] }, 1, 0]
                            }
                        },
                        pendingCount: {
                            $sum: {
                                $cond: [{ $eq: ['$paymentStatus', 'pending'] }, 1, 0]
                            }
                        },
                        failedCount: {
                            $sum: {
                                $cond: [{ $eq: ['$paymentStatus', 'failed'] }, 1, 0]
                            }
                        }
                    }
                }
            ])
        ]);

        const countsByGateway = orderGatewayCounts.reduce((acc, item) => {
            acc[item._id] = item;
            return acc;
        }, {});

        const logs = [
            ...recentOrders.map((order) => ({
                id: order._id,
                source: 'order',
                orderNumber: order.orderNumber,
                customerName: order.customer?.username || 'Customer',
                restaurantName: order.restaurant?.name || 'Restaurant',
                paymentMethod: order.paymentMethod,
                paymentStatus: order.paymentStatus,
                amount: order.pricing?.total || 0,
                reference: order.esewaRefId || order.khaltiRefId || order.esewaTransactionId || order.khaltiPidx || 'COD',
                createdAt: order.createdAt
            })),
            ...recentPendingPayments.map((payment) => ({
                id: payment._id,
                source: 'pending_payment',
                orderNumber: 'Pending Payment',
                customerName: payment.user?.username || 'Customer',
                restaurantName: payment.cartData?.restaurantGroups?.length > 1 ? 'Multiple restaurants' : 'Single restaurant',
                paymentMethod: payment.paymentMethod,
                paymentStatus: payment.status,
                amount: payment.totalAmount || 0,
                reference: payment.transactionId || 'Awaiting gateway reference',
                createdAt: payment.createdAt
            }))
        ]
            .sort((first, second) => new Date(second.createdAt) - new Date(first.createdAt))
            .slice(0, 30);

        res.status(200).json({
            success: true,
            data: {
                gateways: {
                    esewa: {
                        enabled: settings.paymentGateways?.esewa ?? true,
                        paidCount: countsByGateway.esewa?.paidCount || 0,
                        pendingCount: countsByGateway.esewa?.pendingCount || 0,
                        failedCount: countsByGateway.esewa?.failedCount || 0
                    },
                    khalti: {
                        enabled: settings.paymentGateways?.khalti ?? true,
                        paidCount: countsByGateway.khalti?.paidCount || 0,
                        pendingCount: countsByGateway.khalti?.pendingCount || 0,
                        failedCount: countsByGateway.khalti?.failedCount || 0
                    },
                    cod: {
                        enabled: settings.paymentGateways?.cod ?? true,
                        paidCount: countsByGateway.cod?.paidCount || 0,
                        pendingCount: countsByGateway.cod?.pendingCount || 0,
                        failedCount: countsByGateway.cod?.failedCount || 0
                    }
                },
                invoicesPaid: paidInvoices,
                logs
            }
        });
    } catch (error) {
        console.error('Transaction Logs Error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch transaction logs',
            error: error.message
        });
    }
};

/**
 * @desc    Get route and support operations overview
 * @route   GET /api/analytics/route-performance
 * @access  Private/Admin
 */
exports.getRoutePerformance = async (req, res) => {
    try {
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - 7);

        const [
            activeStatusBreakdown,
            activeTrackedOrders,
            deliveredOrders,
            riderLeaderboard,
            activeChatMessages,
            supportCounts
        ] = await Promise.all([
            Order.aggregate([
                {
                    $match: {
                        status: { $in: ['ready', 'picked_up', 'on_the_way'] }
                    }
                },
                {
                    $group: {
                        _id: '$status',
                        count: { $sum: 1 }
                    }
                }
            ]),
            Order.countDocuments({
                status: { $in: ['picked_up', 'on_the_way'] },
                'riderLocationHistory.0': { $exists: true }
            }),
            Order.find({
                status: 'delivered',
                actualDeliveryTime: { $exists: true, $ne: null },
                createdAt: { $gte: startDate }
            }).select('createdAt actualDeliveryTime estimatedDeliveryTime'),
            Order.aggregate([
                {
                    $match: {
                        status: 'delivered',
                        deliveryRider: { $ne: null },
                        actualDeliveryTime: { $exists: true, $ne: null },
                        createdAt: { $gte: startDate }
                    }
                },
                {
                    $project: {
                        deliveryRider: 1,
                        durationMinutes: {
                            $divide: [{ $subtract: ['$actualDeliveryTime', '$createdAt'] }, 60000]
                        }
                    }
                },
                {
                    $group: {
                        _id: '$deliveryRider',
                        deliveries: { $sum: 1 },
                        averageDuration: { $avg: '$durationMinutes' }
                    }
                },
                { $sort: { deliveries: -1, averageDuration: 1 } },
                { $limit: 5 },
                {
                    $lookup: {
                        from: 'users',
                        localField: '_id',
                        foreignField: '_id',
                        as: 'rider'
                    }
                },
                {
                    $unwind: {
                        path: '$rider',
                        preserveNullAndEmptyArrays: true
                    }
                },
                {
                    $project: {
                        _id: 1,
                        deliveries: 1,
                        averageDuration: 1,
                        name: '$rider.username',
                        averageRating: '$rider.averageRating'
                    }
                }
            ]),
            Message.countDocuments({
                createdAt: { $gte: startDate }
            }),
            SupportTicket.aggregate([
                {
                    $group: {
                        _id: '$status',
                        count: { $sum: 1 }
                    }
                }
            ])
        ]);

        const routeCounts = activeStatusBreakdown.reduce((acc, item) => {
            acc[item._id] = item.count;
            return acc;
        }, {});

        const supportSummary = supportCounts.reduce((acc, item) => {
            acc[item._id] = item.count;
            return acc;
        }, {});

        let delayedDeliveries = 0;
        const totalMinutes = deliveredOrders.reduce((sum, order) => {
            const durationMinutes = Math.max(
                0,
                Math.round((new Date(order.actualDeliveryTime).getTime() - new Date(order.createdAt).getTime()) / 60000)
            );

            if (order.estimatedDeliveryTime && new Date(order.actualDeliveryTime) > new Date(order.estimatedDeliveryTime)) {
                delayedDeliveries += 1;
            }

            return sum + durationMinutes;
        }, 0);

        const averageDeliveryMinutes = deliveredOrders.length
            ? Math.round(totalMinutes / deliveredOrders.length)
            : 0;

        res.status(200).json({
            success: true,
            data: {
                activeDeliveries: (routeCounts.picked_up || 0) + (routeCounts.on_the_way || 0),
                readyForPickup: routeCounts.ready || 0,
                liveTrackedOrders: activeTrackedOrders,
                averageDeliveryMinutes,
                delayedDeliveries,
                activeChatMessages,
                supportSummary,
                topRiders: riderLeaderboard.map((item) => ({
                    _id: item._id,
                    name: item.name || 'Rider',
                    deliveries: item.deliveries,
                    averageDuration: Math.round(item.averageDuration || 0),
                    averageRating: item.averageRating || 0
                }))
            }
        });
    } catch (error) {
        console.error('Route Performance Error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch route performance analytics',
            error: error.message
        });
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
