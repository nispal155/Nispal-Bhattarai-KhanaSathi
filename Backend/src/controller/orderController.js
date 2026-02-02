const Order = require('../models/Order');
const Cart = require('../models/Cart');
const Menu = require('../models/Menu');
const User = require('../models/User');
const Restaurant = require('../models/Restaurant');
const socketService = require('../services/socket');

/**
 * @desc    Create new orders from cart
 * @route   POST /api/orders
 * @access  Private (Customer)
 */
exports.createOrder = async (req, res) => {
  try {
    const {
      deliveryAddress,
      paymentMethod,
      specialInstructions: globalSpecialInstructions,
      promoCode,
      useLoyaltyPoints
    } = req.body;

    // Get user's cart
    const cart = await Cart.findOne({ user: req.user._id }).populate('restaurantGroups.items.menuItem');

    if (!cart || cart.restaurantGroups.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Cart is empty'
      });
    }

    // Get user for loyalty points
    const user = await User.findById(req.user._id);

    const createdOrders = [];
    let totalOrderValue = 0;
    let pointsToDeduct = 0;

    if (useLoyaltyPoints && user.loyaltyPoints > 0) {
      pointsToDeduct = user.loyaltyPoints;
    }

    // For each restaurant group, create a separate order
    for (const group of cart.restaurantGroups) {
      const subtotal = group.items.reduce((total, item) => total + (item.price * item.quantity), 0);
      const deliveryFee = 50;
      const serviceFee = 20;

      const discount = (createdOrders.length === 0) ? (cart.promoDiscount || 0) : 0;

      let pointsDiscount = 0;
      if (pointsToDeduct > 0) {
        const remainingGroupTotal = subtotal + deliveryFee + serviceFee - discount;
        pointsDiscount = Math.min(pointsToDeduct, remainingGroupTotal);
        pointsToDeduct -= pointsDiscount;
      }

      const total = subtotal + deliveryFee + serviceFee - discount - pointsDiscount;
      totalOrderValue += total;

      const order = await Order.create({
        customer: req.user._id,
        restaurant: group.restaurant,
        items: group.items.map(item => ({
          menuItem: item.menuItem._id,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          specialInstructions: item.specialInstructions
        })),
        status: 'pending',
        deliveryAddress,
        pricing: {
          subtotal,
          deliveryFee,
          serviceFee,
          discount: discount + pointsDiscount,
          total
        },
        paymentMethod,
        paymentStatus: 'pending',
        specialInstructions: globalSpecialInstructions,
        promoCode: (createdOrders.length === 0) ? cart.promoCode : undefined,
        estimatedDeliveryTime: new Date(Date.now() + 45 * 60 * 1000)
      });

      // Update menu item order counts
      for (const item of group.items) {
        await Menu.findByIdAndUpdate(item.menuItem._id, {
          $inc: { orderCount: item.quantity }
        });
      }

      createdOrders.push(order);
    }

    // Calculate loyalty points: 1 point per Rs. 100
    const pointsEarned = Math.floor(totalOrderValue / 100);
    const netPointsChange = pointsEarned - (useLoyaltyPoints ? user.loyaltyPoints - pointsToDeduct : 0);

    await User.findByIdAndUpdate(req.user._id, {
      $inc: { loyaltyPoints: netPointsChange }
    });

    // Clear the cart
    await Cart.findByIdAndDelete(cart._id);

    res.status(201).json({
      success: true,
      message: `${createdOrders.length} order(s) placed successfully`,
      data: createdOrders,
      pointsEarned,
      pointsUsed: useLoyaltyPoints ? user.loyaltyPoints - pointsToDeduct : 0
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to create order',
      error: error.message
    });
  }
};

/**
 * @desc    Get user's orders
 * @route   GET /api/orders/my-orders
 * @access  Private (Customer)
 */
exports.getMyOrders = async (req, res) => {
  try {
    const { status, limit = 10, page = 1 } = req.query;

    let query = { customer: req.user._id };
    if (status) query.status = status;

    const orders = await Order.find(query)
      .populate('restaurant', 'name logoUrl')
      .sort({ createdAt: -1 })
      .limit(Number(limit))
      .skip((Number(page) - 1) * Number(limit));

    const total = await Order.countDocuments(query);

    res.status(200).json({
      success: true,
      count: orders.length,
      total,
      pages: Math.ceil(total / limit),
      data: orders
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
 * @desc    Get single order by ID
 * @route   GET /api/orders/:id
 * @access  Private
 */
exports.getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('restaurant', 'name address contactPhone logoUrl')
      .populate('items.menuItem', 'name price image') // Added image population
      .populate('customer', 'username email')
      .populate('deliveryRider', 'username profilePicture averageRating vehicleDetails');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Check authorization
    const isCustomer = order.customer._id.toString() === req.user._id.toString();
    const isRider = order.deliveryRider && order.deliveryRider._id.toString() === req.user._id.toString();
    const isRestaurant = await Restaurant.findOne({
      _id: order.restaurant._id,
      createdBy: req.user._id
    });
    const isAdmin = req.user.role === 'admin';

    if (!isCustomer && !isRider && !isRestaurant && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this order'
      });
    }

    res.status(200).json({
      success: true,
      data: order
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch order',
      error: error.message
    });
  }
};

/**
 * @desc    Get orders for restaurant
 * @route   GET /api/orders/restaurant
 * @access  Private (Restaurant Manager)
 */
exports.getRestaurantOrders = async (req, res) => {
  try {
    const { status, date } = req.query;

    const restaurant = await Restaurant.findOne({ createdBy: req.user._id });

    if (!restaurant) {
      return res.status(404).json({
        success: false,
        message: 'Restaurant not found'
      });
    }

    let query = { restaurant: restaurant._id };

    if (status) {
      if (status === 'active') {
        query.status = { $in: ['pending', 'confirmed', 'preparing', 'ready'] };
      } else {
        query.status = status;
      }
    }

    if (date) {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);
      query.createdAt = { $gte: startOfDay, $lte: endOfDay };
    }

    const orders = await Order.find(query)
      .populate('customer', 'username')
      .populate('deliveryRider', 'username')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: orders.length,
      data: orders
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
 * @desc    Update order status (Restaurant)
 * @route   PUT /api/orders/:id/status
 * @access  Private (Restaurant Manager)
 */
exports.updateOrderStatus = async (req, res) => {
  try {
    const { status, note } = req.body;

    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Verify restaurant ownership
    const restaurant = await Restaurant.findOne({
      _id: order.restaurant,
      createdBy: req.user._id
    });

    if (!restaurant && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this order'
      });
    }

    // Validate status transition
    const validTransitions = {
      'pending': ['confirmed', 'cancelled'],
      'confirmed': ['preparing', 'cancelled'],
      'preparing': ['ready', 'cancelled'],
      'ready': ['picked_up'],
      'picked_up': ['on_the_way'],
      'on_the_way': ['delivered'],
      'delivered': [],
      'cancelled': []
    };

    if (!validTransitions[order.status]?.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Cannot change status from ${order.status} to ${status}`
      });
    }

    order.status = status;
    if (note) {
      order.statusHistory.push({ status, note, timestamp: new Date() });
    }

    if (status === 'delivered') {
      order.actualDeliveryTime = new Date();
      order.paymentStatus = 'paid';
    }

    await order.save();

    // Emit live update via Socket.io
    socketService.emitOrderUpdate(order._id.toString(), status, { order });

    res.status(200).json({
      success: true,
      message: 'Order status updated',
      data: order
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update order status',
      error: error.message
    });
  }
};

/**
 * @desc    Assign delivery rider to order
 * @route   PUT /api/orders/:id/assign-rider
 * @access  Private (Admin/Restaurant)
 */
exports.assignRider = async (req, res) => {
  try {
    const { riderId } = req.body;

    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    const rider = await User.findOne({ _id: riderId, role: 'delivery_staff', isOnline: true });

    if (!rider) {
      return res.status(404).json({
        success: false,
        message: 'Rider not found or not available'
      });
    }

    order.deliveryRider = riderId;
    await order.save();

    // Update rider's current assignment
    rider.currentAssignment = order.orderNumber;
    await rider.save();

    // Emit live update
    socketService.emitOrderUpdate(order._id.toString(), order.status, {
      rider: {
        _id: rider._id,
        username: rider.username,
        profilePicture: rider.profilePicture,
        vehicleDetails: rider.vehicleDetails
      }
    });

    res.status(200).json({
      success: true,
      message: 'Rider assigned successfully',
      data: order
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
 * @desc    Get orders for delivery rider
 * @route   GET /api/orders/rider
 * @access  Private (Delivery Staff)
 */
exports.getRiderOrders = async (req, res) => {
  try {
    const { status } = req.query;

    let query = { deliveryRider: req.user._id };

    if (status === 'active') {
      query.status = { $in: ['picked_up', 'on_the_way'] };
    } else if (status === 'completed') {
      query.status = 'delivered';
    } else if (status) {
      query.status = status;
    }

    const orders = await Order.find(query)
      .populate('restaurant', 'name address contactPhone')
      .populate('customer', 'username')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: orders.length,
      data: orders
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
 * @desc    Get available orders for pickup (for riders)
 * @route   GET /api/orders/available
 * @access  Private (Delivery Staff)
 */
exports.getAvailableOrders = async (req, res) => {
  try {
    const orders = await Order.find({
      status: 'ready',
      deliveryRider: null
    })
      .populate('restaurant', 'name address')
      .sort({ createdAt: 1 });

    res.status(200).json({
      success: true,
      count: orders.length,
      data: orders
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
 * @desc    Accept order for delivery (rider self-assigns)
 * @route   PUT /api/orders/:id/accept
 * @access  Private (Delivery Staff)
 */
exports.acceptOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    if (order.status !== 'ready') {
      return res.status(400).json({
        success: false,
        message: 'Order is not ready for pickup'
      });
    }

    if (order.deliveryRider) {
      return res.status(400).json({
        success: false,
        message: 'Order already assigned to another rider'
      });
    }

    order.deliveryRider = req.user._id;
    order.status = 'picked_up';
    await order.save();

    // Update rider's current assignment
    await User.findByIdAndUpdate(req.user._id, {
      currentAssignment: order.orderNumber
    });

    // Emit live update
    socketService.emitOrderUpdate(order._id.toString(), 'picked_up', { order });

    res.status(200).json({
      success: true,
      message: 'Order accepted successfully',
      data: order
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to accept order',
      error: error.message
    });
  }
};

/**
 * @desc    Update delivery status (rider)
 * @route   PUT /api/orders/:id/delivery-status
 * @access  Private (Delivery Staff)
 */
exports.updateDeliveryStatus = async (req, res) => {
  try {
    const { status } = req.body;

    const order = await Order.findOne({
      _id: req.params.id,
      deliveryRider: req.user._id
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found or not assigned to you'
      });
    }

    const validTransitions = {
      'picked_up': ['on_the_way'],
      'on_the_way': ['delivered']
    };

    if (!validTransitions[order.status]?.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Cannot change status from ${order.status} to ${status}`
      });
    }

    order.status = status;

    if (status === 'delivered') {
      order.actualDeliveryTime = new Date();
      order.paymentStatus = 'paid';

      // Update rider stats
      await User.findByIdAndUpdate(req.user._id, {
        $inc: { completedOrders: 1 },
        currentAssignment: 'None'
      });
    }

    await order.save();

    // Emit live update
    socketService.emitOrderUpdate(order._id.toString(), status, { order });

    res.status(200).json({
      success: true,
      message: 'Delivery status updated',
      data: order
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
 * @desc    Cancel order
 * @route   PUT /api/orders/:id/cancel
 * @access  Private
 */
exports.cancelOrder = async (req, res) => {
  try {
    const { reason } = req.body;

    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Check if user is authorized to cancel
    const isCustomer = order.customer.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isCustomer && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to cancel this order'
      });
    }

    // Order modification window check (2 minutes)
    const orderTime = new Date(order.createdAt).getTime();
    const currentTime = new Date().getTime();
    const diffInMinutes = (currentTime - orderTime) / (1000 * 60);

    if (isCustomer && diffInMinutes > 2) {
      return res.status(400).json({
        success: false,
        message: 'Order modification window (2 mins) has passed. Cannot cancel now.'
      });
    }

    // Can only cancel pending or confirmed orders
    if (!['pending', 'confirmed'].includes(order.status)) {
      return res.status(400).json({
        success: false,
        message: 'Order cannot be cancelled at this stage'
      });
    }

    order.status = 'cancelled';
    order.statusHistory.push({
      status: 'cancelled',
      note: reason || 'Cancelled by user',
      timestamp: new Date()
    });

    await order.save();

    // Emit live update
    socketService.emitOrderUpdate(order._id.toString(), 'cancelled', { order });

    res.status(200).json({
      success: true,
      message: 'Order cancelled successfully',
      data: order
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
 * @desc    Get order statistics (Admin)
 * @route   GET /api/orders/stats
 * @access  Private (Admin)
 */
exports.getOrderStats = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [
      totalOrders,
      todayOrders,
      pendingOrders,
      completedOrders,
      cancelledOrders,
      revenueStats
    ] = await Promise.all([
      Order.countDocuments(),
      Order.countDocuments({ createdAt: { $gte: today } }),
      Order.countDocuments({ status: 'pending' }),
      Order.countDocuments({ status: 'delivered' }),
      Order.countDocuments({ status: 'cancelled' }),
      Order.aggregate([
        { $match: { status: 'delivered' } },
        { $group: { _id: null, totalRevenue: { $sum: '$pricing.total' } } }
      ])
    ]);

    res.status(200).json({
      success: true,
      data: {
        totalOrders,
        todayOrders,
        pendingOrders,
        completedOrders,
        cancelledOrders,
        totalRevenue: revenueStats[0]?.totalRevenue || 0
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch order statistics',
      error: error.message
    });
  }
};
