const MultiOrder = require('../models/MultiOrder');
const Order = require('../models/Order');
const User = require('../models/User');
const Restaurant = require('../models/Restaurant');
const socketService = require('../services/socket');
const Notification = require('../models/Notification');

/**
 * @desc    Get multi-order by ID with all sub-orders populated
 * @route   GET /api/multi-orders/:id
 * @access  Private
 */
exports.getMultiOrderById = async (req, res) => {
    try {
        const multiOrder = await MultiOrder.findById(req.params.id)
            .populate({
                path: 'subOrders',
                populate: [
                    { path: 'restaurant', select: 'name logoUrl address contactPhone' },
                    { path: 'items.menuItem', select: 'name price image' }
                ]
            })
            .populate('customer', 'username email phone')
            .populate('primaryRider', 'username profilePicture phone vehicleDetails averageRating');

        if (!multiOrder) {
            return res.status(404).json({
                success: false,
                message: 'Multi-order not found'
            });
        }

        // Check authorization
        const isCustomer = multiOrder.customer._id.toString() === req.user._id.toString();
        const isRider = multiOrder.primaryRider && multiOrder.primaryRider._id.toString() === req.user._id.toString();
        const isAdmin = req.user.role === 'admin';

        // Check if user is a restaurant owner for any sub-order
        let isRestaurantOwner = false;
        for (const subOrder of multiOrder.subOrders) {
            const restaurant = await Restaurant.findOne({
                _id: subOrder.restaurant._id,
                createdBy: req.user._id
            });
            if (restaurant) {
                isRestaurantOwner = true;
                break;
            }
        }

        if (!isCustomer && !isRider && !isRestaurantOwner && !isAdmin) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to view this order'
            });
        }

        res.status(200).json({
            success: true,
            data: multiOrder
        });
    } catch (error) {
        console.error('Get multi-order error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch multi-order',
            error: error.message
        });
    }
};

/**
 * @desc    Get customer's multi-orders
 * @route   GET /api/multi-orders/my-orders
 * @access  Private (Customer)
 */
exports.getMyMultiOrders = async (req, res) => {
    try {
        const { status, limit = 10, page = 1 } = req.query;

        let query = { customer: req.user._id };
        if (status) {
            if (status === 'active') {
                query.status = { $nin: ['delivered', 'cancelled'] };
            } else {
                query.status = status;
            }
        }

        const multiOrders = await MultiOrder.find(query)
            .populate({
                path: 'subOrders',
                populate: { path: 'restaurant', select: 'name logoUrl' }
            })
            .sort({ createdAt: -1 })
            .limit(Number(limit))
            .skip((Number(page) - 1) * Number(limit));

        const total = await MultiOrder.countDocuments(query);

        res.status(200).json({
            success: true,
            count: multiOrders.length,
            total,
            pages: Math.ceil(total / limit),
            data: multiOrders
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to fetch multi-orders',
            error: error.message
        });
    }
};

/**
 * @desc    Assign primary rider to multi-order (assigned to all sub-orders)
 * @route   PUT /api/multi-orders/:id/assign-rider
 * @access  Private (Admin or when first restaurant accepts)
 */
exports.assignRiderToMultiOrder = async (req, res) => {
    try {
        const { riderId } = req.body;

        const multiOrder = await MultiOrder.findById(req.params.id)
            .populate('subOrders');

        if (!multiOrder) {
            return res.status(404).json({
                success: false,
                message: 'Multi-order not found'
            });
        }

        // Check if rider is already assigned
        if (multiOrder.primaryRider) {
            return res.status(400).json({
                success: false,
                message: 'Rider already assigned to this order'
            });
        }

        // Find available rider
        const rider = await User.findOne({
            _id: riderId,
            role: 'delivery_staff',
            isOnline: true
        });

        if (!rider) {
            return res.status(404).json({
                success: false,
                message: 'Rider not found or not available'
            });
        }

        // Assign rider to multi-order
        multiOrder.primaryRider = riderId;
        await multiOrder.save();

        // Assign rider to all sub-orders
        for (const subOrder of multiOrder.subOrders) {
            await Order.findByIdAndUpdate(subOrder._id, {
                deliveryRider: riderId
            });

            // Emit socket event for each sub-order
            socketService.emitOrderUpdate(subOrder._id.toString(), subOrder.status, {
                rider: {
                    _id: rider._id,
                    username: rider.username,
                    profilePicture: rider.profilePicture,
                    vehicleDetails: rider.vehicleDetails
                }
            });
        }

        // Update rider's current assignment
        rider.currentAssignment = multiOrder.orderNumber;
        await rider.save();

        // Create notification for rider
        await Notification.create({
            user: riderId,
            type: 'order_status',
            title: 'New Multi-Restaurant Order Assignment',
            message: `You have been assigned to order ${multiOrder.orderNumber} with ${multiOrder.restaurantCount} restaurants`,
            data: { multiOrderId: multiOrder._id }
        });

        // Emit socket event
        socketService.emitOrderUpdate(multiOrder._id.toString(), 'rider_assigned', {
            rider: {
                _id: rider._id,
                username: rider.username,
                profilePicture: rider.profilePicture,
                vehicleDetails: rider.vehicleDetails
            }
        });

        res.status(200).json({
            success: true,
            message: 'Rider assigned to all restaurants in order',
            data: multiOrder
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to assign rider',
            error: error.message
        });
    }
};

/**
 * @desc    Get multi-order tracking status (aggregated view)
 * @route   GET /api/multi-orders/:id/tracking
 * @access  Private
 */
exports.getMultiOrderTracking = async (req, res) => {
    try {
        const multiOrder = await MultiOrder.findById(req.params.id)
            .populate({
                path: 'subOrders',
                select: 'orderNumber restaurant status statusHistory estimatedDeliveryTime',
                populate: { path: 'restaurant', select: 'name logoUrl address' }
            })
            .populate('primaryRider', 'username profilePicture phone vehicleDetails')
            .populate('customer', 'username phone');

        if (!multiOrder) {
            return res.status(404).json({
                success: false,
                message: 'Multi-order not found'
            });
        }

        // Build tracking response
        const trackingData = {
            orderNumber: multiOrder.orderNumber,
            overallStatus: multiOrder.status,
            statusHistory: multiOrder.statusHistory,
            restaurantCount: multiOrder.restaurantCount,
            rider: multiOrder.primaryRider,
            deliveryAddress: multiOrder.deliveryAddress,
            estimatedDeliveryTime: multiOrder.estimatedDeliveryTime,
            subOrders: multiOrder.subOrders.map(so => ({
                _id: so._id,
                orderNumber: so.orderNumber,
                restaurant: so.restaurant,
                status: so.status,
                statusHistory: so.statusHistory,
                isReady: multiOrder.pickupStatus.find(ps =>
                    ps.subOrder.toString() === so._id.toString()
                )?.isReady || false,
                isPickedUp: multiOrder.pickupStatus.find(ps =>
                    ps.subOrder.toString() === so._id.toString()
                )?.isPickedUp || false
            })),
            pricing: multiOrder.pricing,
            createdAt: multiOrder.createdAt
        };

        res.status(200).json({
            success: true,
            data: trackingData
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to fetch tracking data',
            error: error.message
        });
    }
};

/**
 * @desc    Mark a sub-order as picked up (rider action)
 * @route   PUT /api/multi-orders/:id/pickup/:subOrderId
 * @access  Private (Delivery Staff)
 */
exports.markSubOrderPickedUp = async (req, res) => {
    try {
        const { id, subOrderId } = req.params;

        const multiOrder = await MultiOrder.findById(id);

        if (!multiOrder) {
            return res.status(404).json({
                success: false,
                message: 'Multi-order not found'
            });
        }

        // Verify rider is assigned
        if (!multiOrder.primaryRider || multiOrder.primaryRider.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized - not the assigned rider'
            });
        }

        // Find the pickup status entry for this sub-order
        const pickupEntry = multiOrder.pickupStatus.find(
            ps => ps.subOrder.toString() === subOrderId
        );

        if (!pickupEntry) {
            return res.status(404).json({
                success: false,
                message: 'Sub-order not found in this multi-order'
            });
        }

        if (!pickupEntry.isReady) {
            return res.status(400).json({
                success: false,
                message: 'Sub-order is not ready for pickup yet'
            });
        }

        // Mark as picked up
        pickupEntry.isPickedUp = true;
        pickupEntry.pickedUpAt = new Date();

        // Update sub-order status
        await Order.findByIdAndUpdate(subOrderId, { status: 'picked_up' });

        // Check if all sub-orders are picked up
        const allPickedUp = multiOrder.pickupStatus.every(ps => ps.isPickedUp);

        if (allPickedUp) {
            multiOrder.status = 'picked_up';

            // Notify customer
            await Notification.create({
                user: multiOrder.customer,
                type: 'order_status',
                title: 'All Orders Picked Up',
                message: `Your rider has collected food from all ${multiOrder.restaurantCount} restaurants and is heading your way!`,
                data: { multiOrderId: multiOrder._id }
            });
        } else {
            multiOrder.status = 'picking_up';

            // Count remaining pickups
            const remaining = multiOrder.pickupStatus.filter(ps => !ps.isPickedUp).length;

            // Notify customer of progress
            socketService.emitOrderUpdate(multiOrder._id.toString(), 'pickup_progress', {
                pickedUp: multiOrder.pickupStatus.filter(ps => ps.isPickedUp).length,
                remaining
            });
        }

        await multiOrder.save();

        res.status(200).json({
            success: true,
            message: allPickedUp ? 'All sub-orders picked up' : 'Sub-order picked up',
            data: {
                allPickedUp,
                pickupStatus: multiOrder.pickupStatus
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to mark pickup',
            error: error.message
        });
    }
};

/**
 * @desc    Update multi-order delivery status (rider action)
 * @route   PUT /api/multi-orders/:id/delivery-status
 * @access  Private (Delivery Staff)
 */
exports.updateMultiOrderDeliveryStatus = async (req, res) => {
    try {
        const { status } = req.body;

        const multiOrder = await MultiOrder.findById(req.params.id)
            .populate('subOrders');

        if (!multiOrder) {
            return res.status(404).json({
                success: false,
                message: 'Multi-order not found'
            });
        }

        // Verify rider is assigned
        if (!multiOrder.primaryRider || multiOrder.primaryRider.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized - not the assigned rider'
            });
        }

        // Valid transitions
        const validTransitions = {
            'picked_up': ['on_the_way', 'delivered'],
            'on_the_way': ['delivered']
        };

        if (!validTransitions[multiOrder.status]?.includes(status)) {
            return res.status(400).json({
                success: false,
                message: `Cannot change status from ${multiOrder.status} to ${status}`
            });
        }

        // Update multi-order status
        multiOrder.status = status;

        if (status === 'delivered') {
            multiOrder.actualDeliveryTime = new Date();

            // Update all sub-orders
            for (const subOrder of multiOrder.subOrders) {
                await Order.findByIdAndUpdate(subOrder._id, {
                    status: 'delivered',
                    actualDeliveryTime: new Date(),
                    paymentStatus: 'paid'
                });
            }

            // Update rider stats
            await User.findByIdAndUpdate(req.user._id, {
                $inc: { completedOrders: multiOrder.subOrders.length },
                currentAssignment: 'None'
            });

            // Notify customer
            await Notification.create({
                user: multiOrder.customer,
                type: 'order_status',
                title: 'Order Delivered! 🎉',
                message: 'Your complete order has been delivered. Enjoy your meal!',
                data: { multiOrderId: multiOrder._id }
            });
        }

        await multiOrder.save();

        // Emit socket event
        socketService.emitOrderUpdate(multiOrder._id.toString(), status, { multiOrder });

        res.status(200).json({
            success: true,
            message: 'Delivery status updated',
            data: multiOrder
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to update delivery status',
            error: error.message
        });
    }
};

/**
 * @desc    Cancel multi-order (cancels all sub-orders)
 * @route   PUT /api/multi-orders/:id/cancel
 * @access  Private
 */
exports.cancelMultiOrder = async (req, res) => {
    try {
        const { reason } = req.body;

        const multiOrder = await MultiOrder.findById(req.params.id)
            .populate('subOrders');

        if (!multiOrder) {
            return res.status(404).json({
                success: false,
                message: 'Multi-order not found'
            });
        }

        // Check authorization
        const isCustomer = multiOrder.customer.toString() === req.user._id.toString();
        const isAdmin = req.user.role === 'admin';

        if (!isCustomer && !isAdmin) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to cancel this order'
            });
        }

        // Check cancellation window (2 minutes)
        const orderTime = new Date(multiOrder.createdAt).getTime();
        const currentTime = new Date().getTime();
        const diffInMinutes = (currentTime - orderTime) / (1000 * 60);

        if (isCustomer && diffInMinutes > 2) {
            return res.status(400).json({
                success: false,
                message: 'Order modification window (2 mins) has passed. Cannot cancel now.'
            });
        }

        // Can only cancel if not too far in process
        const nonCancellableStatuses = ['picking_up', 'picked_up', 'on_the_way', 'delivered', 'cancelled'];
        if (nonCancellableStatuses.includes(multiOrder.status)) {
            return res.status(400).json({
                success: false,
                message: 'Order cannot be cancelled at this stage'
            });
        }

        // Cancel multi-order
        multiOrder.status = 'cancelled';
        multiOrder.statusHistory.push({
            status: 'cancelled',
            note: reason || 'Cancelled by user',
            timestamp: new Date()
        });

        // Cancel all sub-orders
        for (const subOrder of multiOrder.subOrders) {
            await Order.findByIdAndUpdate(subOrder._id, {
                status: 'cancelled',
                $push: {
                    statusHistory: {
                        status: 'cancelled',
                        note: `Parent order cancelled: ${reason || 'Cancelled by user'}`,
                        timestamp: new Date()
                    }
                }
            });
        }

        await multiOrder.save();

        // Emit socket event
        socketService.emitOrderUpdate(multiOrder._id.toString(), 'cancelled', { multiOrder });

        res.status(200).json({
            success: true,
            message: 'Multi-order and all sub-orders cancelled',
            data: multiOrder
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to cancel order',
            error: error.message
        });
    }
};

/**
 * @desc    Get rider's multi-order assignments
 * @route   GET /api/multi-orders/rider
 * @access  Private (Delivery Staff)
 */
exports.getRiderMultiOrders = async (req, res) => {
    try {
        const { status } = req.query;

        let query = { primaryRider: req.user._id };

        if (status === 'active') {
            query.status = { $in: ['preparing', 'partially_ready', 'all_ready', 'picking_up', 'picked_up', 'on_the_way'] };
        } else if (status === 'completed') {
            query.status = 'delivered';
        } else if (status) {
            query.status = status;
        }

        const multiOrders = await MultiOrder.find(query)
            .populate({
                path: 'subOrders',
                populate: { path: 'restaurant', select: 'name address contactPhone' }
            })
            .populate('customer', 'username phone')
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: multiOrders.length,
            data: multiOrders
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to fetch orders',
            error: error.message
        });
    }
};

/**
 * @desc    Update rider location for multi-order
 * @route   POST /api/multi-orders/:id/location
 * @access  Private (Delivery Staff)
 */
exports.updateRiderLocation = async (req, res) => {
    try {
        const { lat, lng } = req.body;

        const multiOrder = await MultiOrder.findById(req.params.id);

        if (!multiOrder) {
            return res.status(404).json({
                success: false,
                message: 'Multi-order not found'
            });
        }

        if (!multiOrder.primaryRider || multiOrder.primaryRider.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized'
            });
        }

        multiOrder.riderLocationHistory.push({
            lat,
            lng,
            timestamp: new Date()
        });

        await multiOrder.save();

        // Emit real-time location update to customer
        socketService.emitOrderUpdate(multiOrder._id.toString(), 'location_update', {
            lat,
            lng
        });

        res.status(200).json({
            success: true,
            message: 'Location updated'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to update location',
            error: error.message
        });
    }
};

/**
 * @desc    Get available multi-orders for riders (for acceptance)
 * @route   GET /api/multi-orders/available
 * @access  Private (Delivery Staff)
 */
exports.getAvailableMultiOrders = async (req, res) => {
    try {
        // Multi-orders that need rider assignment
        const multiOrders = await MultiOrder.find({
            primaryRider: null,
            status: { $in: ['partially_confirmed', 'all_confirmed', 'preparing'] }
        })
            .populate({
                path: 'subOrders',
                populate: { path: 'restaurant', select: 'name address' }
            })
            .sort({ createdAt: 1 });

        res.status(200).json({
            success: true,
            count: multiOrders.length,
            data: multiOrders
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to fetch available orders',
            error: error.message
        });
    }
};

/**
 * Internal helper: Update multi-order when a sub-order status changes
 * Called from orderController when updating sub-order status
 */
exports.updateMultiOrderFromSubOrder = async (subOrder) => {
    if (!subOrder.multiOrder) return null;

    try {
        const multiOrder = await MultiOrder.findById(subOrder.multiOrder)
            .populate('subOrders', 'status');

        if (!multiOrder) return null;

        // Get all sub-order statuses
        const statuses = multiOrder.subOrders.map(so => so.status);

        // Calculate new aggregated status
        const newStatus = multiOrder.calculateAggregatedStatus(statuses);

        // Update pickup status if sub-order is ready
        if (subOrder.status === 'ready') {
            const pickupEntry = multiOrder.pickupStatus.find(
                ps => ps.subOrder.toString() === subOrder._id.toString()
            );
            if (pickupEntry) {
                pickupEntry.isReady = true;
                pickupEntry.readyAt = new Date();
            }

            // Notify rider if assigned
            if (multiOrder.primaryRider) {
                const restaurant = await Restaurant.findById(subOrder.restaurant);
                await Notification.create({
                    user: multiOrder.primaryRider,
                    type: 'order_status',
                    title: 'Restaurant Ready for Pickup',
                    message: `${restaurant?.name || 'A restaurant'} has your order ready for pickup!`,
                    data: {
                        multiOrderId: multiOrder._id,
                        subOrderId: subOrder._id,
                        restaurantId: subOrder.restaurant
                    }
                });
            }
        }

        if (multiOrder.status !== newStatus) {
            multiOrder.status = newStatus;
        }

        await multiOrder.save();
        return multiOrder;
    } catch (error) {
        console.error('Error updating multi-order from sub-order:', error);
        return null;
    }
};
