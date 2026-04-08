const Order = require('../models/Order');
const Cart = require('../models/Cart');
const Menu = require('../models/Menu');
const User = require('../models/User');
const Restaurant = require('../models/Restaurant');
const MultiOrder = require('../models/MultiOrder');
const socketService = require('../services/socket');
const {
  getRestrictionReasonsForMenuItem,
  calculateCartTotals,
  assertChildCanPurchaseTotal
} = require('../utils/childAccountControls');
const { loadCartForCheckout } = require('../utils/checkoutContext');
const { notifyParentOfChildActivity } = require('../utils/childActivityNotifier');
const { isPaymentGatewayEnabled } = require('../utils/systemSettings');
const {
  calculateDiscountFromPoints,
  calculatePointsEarned,
  calculatePointsNeededForDiscount,
  normalizeLoyaltyPoints
} = require('../utils/loyalty');

const assertPaymentGatewayEnabled = async (gateway) => {
  const enabled = await isPaymentGatewayEnabled(gateway);
  if (!enabled) {
    const error = new Error(`${gateway.toUpperCase()} payments are temporarily disabled by the admin.`);
    error.statusCode = 503;
    error.code = 'PAYMENT_GATEWAY_DISABLED';
    throw error;
  }
};

// Helper to strip sensitive financial data for riders
const stripFinancialsForRider = (order) => {
  const o = order.toObject ? order.toObject() : order;
  if (o.pricing) {
    // Keep total for COD purposes, but hide breakdown
    delete o.pricing.subtotal;
    delete o.pricing.serviceFee;
    delete o.pricing.discount;
  }
  if (o.items) {
    o.items = o.items.map(item => {
      // Hide individual item prices
      const { price, ...rest } = item;
      return rest;
    });
  }
  return o;
};

const multiOrderController = require('./multiOrderController');

const assertChildParentApproval = (user, cart) => {
  if (!user || user.role !== 'child') {
    return;
  }

  const status = cart?.parentApproval?.status;
  if (status !== 'approved') {
    const error = new Error(
      status === 'pending_parent_approval'
        ? 'Your cart is waiting for parent approval.'
        : 'Parent approval is required before checkout.'
    );
    error.statusCode = 403;
    error.code = 'CHILD_PARENT_APPROVAL_REQUIRED';
    throw error;
  }
};

const getEntityIdString = (value) => {
  if (!value) {
    return '';
  }

  if (typeof value === 'string') {
    return value;
  }

  if (value?._id) {
    return value._id.toString();
  }

  return value.toString();
};

const resetChildApprovalOnCartMutation = (cart, user) => {
  if (user?.role !== 'child') {
    return;
  }

  cart.parentApproval = {
    ...cart.parentApproval,
    status: 'not_required',
    reviewedAt: null,
    reviewedBy: null,
    note: ''
  };
};

const populateCartForResponse = (cartId) => (
  Cart.findById(cartId)
    .populate('restaurantGroups.restaurant', 'name logoUrl')
    .populate('restaurantGroups.items.menuItem', 'name price image isAvailable')
    .populate('collaborators', 'username profilePicture')
    .populate('user', 'username profilePicture')
);

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
      useLoyaltyPoints,
      childCartId
    } = req.body;

    // IMPORTANT: Only allow COD orders through this endpoint
    // eSewa and Khalti orders must go through the payment flow first
    if (paymentMethod === 'esewa' || paymentMethod === 'khalti') {
      return res.status(400).json({
        success: false,
        message: `For ${paymentMethod} payment, please use the payment initiation endpoint. Orders are created only after successful payment.`
      });
    }

    if (paymentMethod === 'cod') {
      await assertPaymentGatewayEnabled('cod');
    }

    // Resolve whether this is the payer's own cart or an approved child cart.
    const { cart, cartOwner, isParentCheckout } = await loadCartForCheckout(req.user, childCartId, {
      populateMenuItems: true
    });
    console.log('Cart found for checkout owner:', cartOwner?._id, cart ? 'Yes' : 'No');

    if (!cart || cart.restaurantGroups.length === 0) {
      console.log('Cart is empty or not found');
      return res.status(400).json({
        success: false,
        message: 'Cart is empty'
      });
    }
    console.log('Cart groups count:', cart.restaurantGroups.length);

    assertChildParentApproval(cartOwner, cart);

    // Get user for loyalty points
    const user = await User.findById(cartOwner._id);
    for (const group of cart.restaurantGroups) {
      for (const item of group.items) {
        const menuItem = item.menuItem?._id ? item.menuItem : null;
        const restrictionReasons = getRestrictionReasonsForMenuItem(menuItem, user);
        if (restrictionReasons.length > 0) {
          return res.status(403).json({
            success: false,
            message: restrictionReasons[0],
            code: 'CHILD_MENU_ITEM_RESTRICTED'
          });
        }
      }
    }

    const projectedTotals = calculateCartTotals(cart, useLoyaltyPoints, user.loyaltyPoints);
    if (!isParentCheckout) {
      await assertChildCanPurchaseTotal(user, projectedTotals.total);
    }

    const createdOrders = [];
    let totalOrderValue = 0;
    let remainingPoints = 0;
    let actualPointsUsed = 0;

    if (useLoyaltyPoints && user.loyaltyPoints > 0) {
      remainingPoints = normalizeLoyaltyPoints(user.loyaltyPoints);
    }

    // For each restaurant group, create a separate order
    for (const group of cart.restaurantGroups) {
      const subtotal = group.items.reduce((total, item) => total + (item.price * item.quantity), 0);
      const deliveryFee = 50;
      const serviceFee = 20;

      const discount = (createdOrders.length === 0) ? (cart.promoDiscount || 0) : 0;

      let pointsDiscount = 0;
      if (remainingPoints > 0) {
        const remainingGroupTotal = subtotal + deliveryFee + serviceFee - discount;
        pointsDiscount = calculateDiscountFromPoints(remainingPoints, remainingGroupTotal);

        if (pointsDiscount > 0) {
          const pointsAppliedToGroup = calculatePointsNeededForDiscount(pointsDiscount);
          remainingPoints -= pointsAppliedToGroup;
          actualPointsUsed += pointsAppliedToGroup;
        }
      }

      const total = subtotal + deliveryFee + serviceFee - discount - pointsDiscount;
      totalOrderValue += total;

      console.log('Creating order for restaurant:', group.restaurant);
      const order = await Order.create({
        customer: cartOwner._id,
        restaurant: group.restaurant,
        items: group.items.map(item => {
          // Handle both populated and non-populated menuItem
          const menuItemId = item.menuItem?._id || item.menuItem;
          return {
            menuItem: menuItemId,
            name: item.name,
            price: item.price,
            quantity: item.quantity,
            specialInstructions: item.specialInstructions
          };
        }),
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
        const menuItemId = item.menuItem?._id || item.menuItem;
        await Menu.findByIdAndUpdate(menuItemId, {
          $inc: { orderCount: item.quantity }
        });
      }

      createdOrders.push(order);
    }

    // If multiple restaurants, create a MultiOrder to group them
    let multiOrder = null;
    if (createdOrders.length > 1) {
      console.log('Creating MultiOrder for', createdOrders.length, 'restaurants');

      multiOrder = await MultiOrder.create({
        customer: cartOwner._id,
        subOrders: createdOrders.map(o => o._id),
        restaurantCount: createdOrders.length,
        deliveryAddress,
        pricing: {
          subtotal: createdOrders.reduce((sum, o) => sum + o.pricing.subtotal, 0),
          deliveryFee: createdOrders.reduce((sum, o) => sum + o.pricing.deliveryFee, 0),
          serviceFee: createdOrders.reduce((sum, o) => sum + o.pricing.serviceFee, 0),
          discount: createdOrders.reduce((sum, o) => sum + o.pricing.discount, 0),
          total: totalOrderValue
        },
        paymentMethod,
        paymentStatus: 'pending',
        paymentDistribution: createdOrders.map(o => ({
          restaurant: o.restaurant,
          amount: o.pricing.total,
          percentage: (o.pricing.total / totalOrderValue) * 100,
          status: 'pending'
        })),
        pickupStatus: createdOrders.map(o => ({
          subOrder: o._id,
          restaurant: o.restaurant,
          isReady: false,
          isPickedUp: false
        })),
        specialInstructions: globalSpecialInstructions,
        promoCode: cart.promoCode,
        estimatedDeliveryTime: new Date(Date.now() + 60 * 60 * 1000) // 60 mins for multi-restaurant
      });

      // Link sub-orders to parent MultiOrder
      for (let i = 0; i < createdOrders.length; i++) {
        createdOrders[i].multiOrder = multiOrder._id;
        createdOrders[i].isSubOrder = true;
        createdOrders[i].subOrderIndex = i + 1;
        await createdOrders[i].save();
      }
    }

    // Earn 1 point per Rs. 100 spent. Redemption uses 10 points per Rs. 1.
    const pointsEarned = calculatePointsEarned(totalOrderValue);
    const initialLoyaltyPoints = Number(user.loyaltyPoints || 0);
    const netPointsChange = pointsEarned - actualPointsUsed;
    const updatedLoyaltyPoints = Math.max(initialLoyaltyPoints + netPointsChange, 0);

    await User.findByIdAndUpdate(cartOwner._id, {
      $set: { loyaltyPoints: updatedLoyaltyPoints }
    });

    // Clear the cart
    await Cart.findByIdAndDelete(cart._id);

    // Create Notification for Restaurant Owner (not the restaurant doc)
    const Notification = require('../models/Notification');
    const Restaurant = require('../models/Restaurant');
    for (const order of createdOrders) {
      try {
        const restaurant = await Restaurant.findById(order.restaurant);
        const ownerId = restaurant?.createdBy || restaurant?.owner;
        if (ownerId) {
          await Notification.create({
            user: ownerId,
            type: 'order_status',
            title: 'New Order Received',
            message: `You have a new order #${order.orderNumber}`,
            data: { orderId: order._id }
          });
          // Push real-time notification via socket
          try {
            const { getIO } = require('../services/socket');
            getIO().to(ownerId.toString()).emit('notification', {
              type: 'order_status',
              title: 'New Order Received',
              message: `You have a new order #${order.orderNumber}`,
              orderId: order._id
            });
          } catch (socketErr) { /* socket not critical */ }
        }
      } catch (notifError) {
        console.error(`Failed to create notification for order ${order._id}:`, notifError.message);
      }
    }

    res.status(201).json({
      success: true,
      message: `${createdOrders.length} order(s) placed successfully`,
      data: createdOrders,
      multiOrder: multiOrder ? { _id: multiOrder._id, orderNumber: multiOrder.orderNumber } : null,
      isMultiRestaurant: createdOrders.length > 1,
      pointsEarned,
      pointsUsed: actualPointsUsed,
      loyaltyPointsBalance: updatedLoyaltyPoints
    });
  } catch (error) {
    if (
      req.user?.role === 'child' &&
      ['CHILD_PARENT_APPROVAL_REQUIRED', 'CHILD_SPENDING_LIMIT_REACHED', 'CHILD_MENU_ITEM_RESTRICTED'].includes(error.code)
    ) {
      try {
        await notifyParentOfChildActivity(req.user, {
          title: 'Child Checkout Attempt',
          message: `${req.user.username} tried to place an order, but it needs parent review first. Reason: ${error.message}`,
          link: '/cart'
        });
      } catch (notificationError) {
        console.error('Failed to notify parent about child checkout attempt:', notificationError.message);
      }
    }

    console.error('Order creation error:', error.message);
    console.error('Error stack:', error.stack);
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.statusCode ? error.message : 'Failed to create order',
      error: error.message,
      code: error.code,
      details: error.details,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
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

    let query = {
      customer: req.user._id,
      isHiddenForCustomer: { $ne: true }
    };
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
      .populate('customer', 'username email parentAccount')
      .populate('deliveryRider', 'username profilePicture averageRating vehicleDetails');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Check authorization
    const isCustomer = order.customer._id.toString() === req.user._id.toString();
    const isLinkedParent = req.user.role === 'customer'
      && order.customer.parentAccount
      && order.customer.parentAccount.toString() === req.user._id.toString();
    const isRider = order.deliveryRider && order.deliveryRider._id.toString() === req.user._id.toString();
    const isRestaurant = await Restaurant.findOne({
      _id: order.restaurant._id,
      createdBy: req.user._id
    });
    const isAdmin = req.user.role === 'admin';

    if (!isCustomer && !isLinkedParent && !isRider && !isRestaurant && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this order'
      });
    }

    // Strip sensitive fields for riders
    let orderData = order.toObject();
    if (isRider && !isAdmin && !isRestaurant) {
      orderData = stripFinancialsForRider(order);
    }

    res.status(200).json({
      success: true,
      data: orderData
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
 * @desc    Reorder a previous meal into the active cart
 * @route   POST /api/orders/:id/reorder
 * @access  Private (Customer/Child)
 */
exports.reorderPreviousOrder = async (req, res) => {
  try {
    const order = await Order.findOne({
      _id: req.params.id,
      customer: req.user._id,
      isHiddenForCustomer: { $ne: true }
    }).populate('restaurant', 'name');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found',
        code: 'ORDER_NOT_FOUND'
      });
    }

    let cart = await Cart.findOne({
      $or: [
        { user: req.user._id },
        { collaborators: req.user._id }
      ]
    });

    const orderRestaurantId = getEntityIdString(order.restaurant);
    const conflictingGroup = (cart?.restaurantGroups || []).find(
      (group) => getEntityIdString(group.restaurant) !== orderRestaurantId
    );

    if (conflictingGroup) {
      const existingRestaurant = await Restaurant.findById(conflictingGroup.restaurant).select('name');
      return res.status(409).json({
        success: false,
        code: 'DIFFERENT_RESTAURANT',
        message: `Your cart already has items from ${existingRestaurant?.name || 'another restaurant'}. Clear your cart first to reorder this meal.`,
        existingRestaurant: existingRestaurant?.name || 'another restaurant'
      });
    }

    const orderedMenuItemIds = [...new Set(
      (order.items || [])
        .map((item) => getEntityIdString(item.menuItem))
        .filter(Boolean)
    )];

    const liveMenuItems = await Menu.find({
      _id: { $in: orderedMenuItemIds },
      restaurant: orderRestaurantId
    }).select('name price image isAvailable restaurant isJunkFood containsCaffeine allergens');

    const liveMenuItemsById = new Map(
      liveMenuItems.map((menuItem) => [menuItem._id.toString(), menuItem])
    );

    const skippedItems = [];
    const restrictedItemNames = [];
    const reorderableItems = [];

    for (const item of order.items || []) {
      const menuItemId = getEntityIdString(item.menuItem);
      const liveMenuItem = liveMenuItemsById.get(menuItemId);

      if (!liveMenuItem) {
        skippedItems.push({
          menuItemId,
          name: item.name,
          reason: 'No longer on the menu'
        });
        continue;
      }

      if (!liveMenuItem.isAvailable) {
        skippedItems.push({
          menuItemId,
          name: liveMenuItem.name || item.name,
          reason: 'Currently unavailable'
        });
        continue;
      }

      const restrictionReasons = getRestrictionReasonsForMenuItem(liveMenuItem, req.user);
      if (restrictionReasons.length > 0) {
        skippedItems.push({
          menuItemId,
          name: liveMenuItem.name || item.name,
          reason: restrictionReasons[0]
        });
        restrictedItemNames.push(liveMenuItem.name || item.name);
        continue;
      }

      reorderableItems.push({
        liveMenuItem,
        quantity: Number(item.quantity || 1),
        specialInstructions: item.specialInstructions || ''
      });
    }

    if (req.user.role === 'child' && restrictedItemNames.length > 0) {
      try {
        const visibleNames = restrictedItemNames.slice(0, 2).join(', ');
        const extraCount = Math.max(restrictedItemNames.length - 2, 0);
        const itemSummary = extraCount > 0 ? `${visibleNames} and ${extraCount} more item(s)` : visibleNames;

        await notifyParentOfChildActivity(req.user, {
          title: 'Blocked Reorder Attempt',
          message: `${req.user.username} tried to reorder ${itemSummary}, but some items were blocked by parental controls.`,
          link: '/cart'
        });
      } catch (notificationError) {
        console.error('Failed to notify parent about blocked reorder attempt:', notificationError.message);
      }
    }

    if (reorderableItems.length === 0) {
      return res.status(400).json({
        success: false,
        code: 'REORDER_NO_AVAILABLE_ITEMS',
        message: 'None of the items from this order can be reordered right now.',
        details: {
          skippedItems
        }
      });
    }

    if (!cart) {
      cart = new Cart({
        user: req.user._id,
        restaurantGroups: []
      });
    }

    let groupIndex = cart.restaurantGroups.findIndex(
      (group) => getEntityIdString(group.restaurant) === orderRestaurantId
    );

    if (groupIndex === -1) {
      cart.restaurantGroups.push({
        restaurant: orderRestaurantId,
        items: []
      });
      groupIndex = cart.restaurantGroups.length - 1;
    }

    let addedItemsCount = 0;

    for (const item of reorderableItems) {
      const menuItemId = item.liveMenuItem._id.toString();
      const existingItemIndex = cart.restaurantGroups[groupIndex].items.findIndex(
        (cartItem) => getEntityIdString(cartItem.menuItem) === menuItemId
      );

      if (existingItemIndex > -1) {
        cart.restaurantGroups[groupIndex].items[existingItemIndex].quantity += item.quantity;
        if (
          item.specialInstructions &&
          !cart.restaurantGroups[groupIndex].items[existingItemIndex].specialInstructions
        ) {
          cart.restaurantGroups[groupIndex].items[existingItemIndex].specialInstructions = item.specialInstructions;
        }
      } else {
        cart.restaurantGroups[groupIndex].items.push({
          menuItem: item.liveMenuItem._id,
          name: item.liveMenuItem.name,
          price: item.liveMenuItem.price,
          image: item.liveMenuItem.image,
          quantity: item.quantity,
          specialInstructions: item.specialInstructions,
          addedBy: req.user._id
        });
      }

      addedItemsCount += item.quantity;
    }

    resetChildApprovalOnCartMutation(cart, req.user);
    await cart.save();

    const populatedCart = await populateCartForResponse(cart._id);

    if (populatedCart?.isShared && populatedCart.shareCode) {
      socketService.getIO().to(populatedCart.shareCode).emit('cartUpdated', populatedCart);
    }

    const summaryMessage = skippedItems.length > 0
      ? `Reordered ${addedItemsCount} item(s). ${skippedItems.length} item(s) could not be added.`
      : 'Previous meal added to cart';

    res.status(200).json({
      success: true,
      message: summaryMessage,
      data: {
        cart: populatedCart,
        addedItemsCount,
        skippedItems
      }
    });
  } catch (error) {
    res.status(error.statusCode || 500).json({
      success: false,
      message: 'Failed to reorder previous meal',
      error: error.message,
      code: error.code,
      details: error.details
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
    } else if (req.query.startDate && req.query.endDate) {
      const start = new Date(req.query.startDate);
      start.setHours(0, 0, 0, 0);
      const end = new Date(req.query.endDate);
      end.setHours(23, 59, 59, 999);
      query.createdAt = { $gte: start, $lte: end };
    }

    const orders = await Order.find(query)
      .populate('customer', 'username phone email')
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

    console.log('Update order status request:', { orderId: req.params.id, newStatus: status, note });

    if (!status) {
      return res.status(400).json({
        success: false,
        message: 'Status is required'
      });
    }

    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    console.log('Current order status:', order.status, '-> New status:', status);

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
      'pending': ['confirmed', 'preparing', 'cancelled'],  // Allow direct to preparing (auto-confirms)
      'confirmed': ['preparing', 'cancelled'],
      'preparing': ['ready', 'cancelled'],
      'ready': ['picked_up'],
      'picked_up': ['on_the_way', 'delivered'],  // Allow direct to delivered or via on_the_way
      'on_the_way': ['delivered'],
      'delivered': [],
      'cancelled': []
    };

    // Allow same status (no-op) or valid transitions
    if (order.status !== status && !validTransitions[order.status]?.includes(status)) {
      console.log('Invalid status transition:', order.status, '->', status);
      return res.status(400).json({
        success: false,
        message: `Cannot change status from ${order.status} to ${status}`
      });
    }

    // If same status, just return success without saving
    if (order.status === status) {
      return res.status(200).json({
        success: true,
        message: 'Order status unchanged',
        data: order
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

    // If this is a sub-order, update the parent MultiOrder status
    if (order.isSubOrder && order.multiOrder) {
      await multiOrderController.updateMultiOrderFromSubOrder(order);
    }

    // Create Persistent Notification
    const Notification = require('../models/Notification');
    let notificationTitle = 'Order Updated';
    let notificationMessage = `Your order status has changed to ${status}`;

    if (status === 'confirmed') {
      notificationTitle = 'Order Confirmed';
      notificationMessage = 'The restaurant has confirmed your order and will start preparing it soon.';
    } else if (status === 'preparing') {
      notificationTitle = 'Food is being prepared';
      notificationMessage = 'The chef is working on your delicious meal!';
    } else if (status === 'ready') {
      notificationTitle = 'Order Ready';
      notificationMessage = 'Your order is ready for pickup/delivery!';
    } else if (status === 'delivered') {
      notificationTitle = 'Order Delivered';
      notificationMessage = 'Enjoy your food! Don\'t forget to rate us.';
    } else if (status === 'cancelled') {
      notificationTitle = 'Order Cancelled';
      notificationMessage = `Your order has been cancelled. Note: ${note || 'N/A'}`;
    }

    await Notification.create({
      user: order.customer,
      type: 'order_status',
      title: notificationTitle,
      message: notificationMessage,
      data: { orderId: order._id }
    });

    // Also notify the assigned rider (if any) about status changes
    if (order.deliveryRider) {
      let riderNotifTitle = 'Order Updated';
      let riderNotifMessage = `Order #${order.orderNumber} status changed to ${status}.`;

      if (status === 'ready') {
        riderNotifTitle = 'Order Ready for Pickup';
        riderNotifMessage = `Order #${order.orderNumber} is ready for pickup!`;
      } else if (status === 'cancelled') {
        riderNotifTitle = 'Order Cancelled';
        riderNotifMessage = `Order #${order.orderNumber} has been cancelled.`;
      }

      await Notification.create({
        user: order.deliveryRider,
        type: 'order_status',
        title: riderNotifTitle,
        message: riderNotifMessage,
        data: { orderId: order._id }
      });

      socketService.sendNotification(order.deliveryRider.toString(), {
        type: 'order_status',
        title: riderNotifTitle,
        message: riderNotifMessage,
        orderId: order._id
      });
    }

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

    // If this is a sub-order, sync with multi-order
    if (order.isSubOrder && order.multiOrder) {
      console.log(`Syncing rider ${riderId} for MultiOrder ${order.multiOrder}`);
      const multiOrder = await MultiOrder.findById(order.multiOrder).populate('subOrders');

      if (multiOrder && !multiOrder.primaryRider) {
        multiOrder.primaryRider = riderId;
        await multiOrder.save();

        // Assign to all other sub-orders
        for (const so of multiOrder.subOrders) {
          if (so._id.toString() !== order._id.toString()) {
            so.deliveryRider = riderId;
            await so.save();

            // Emit update for each sub-order
            socketService.emitOrderUpdate(so._id.toString(), so.status, {
              rider: {
                _id: rider._id,
                username: rider.username,
                profilePicture: rider.profilePicture,
                vehicleDetails: rider.vehicleDetails
              }
            });
          }
        }

        // Notify parent order as well
        socketService.emitOrderUpdate(multiOrder._id.toString(), 'rider_assigned', {
          rider: {
            _id: rider._id,
            username: rider.username,
            profilePicture: rider.profilePicture,
            vehicleDetails: rider.vehicleDetails
          }
        });
      }
    }

    // Update rider's current assignment
    rider.currentAssignment = order.orderNumber;
    await rider.save();

    // Create persistent notification for the rider
    const Notification = require('../models/Notification');
    const restaurant = await Restaurant.findById(order.restaurant).select('name');
    await Notification.create({
      user: riderId,
      type: 'order_status',
      title: 'New Delivery Assigned',
      message: `You have been assigned to deliver order #${order.orderNumber} from ${restaurant?.name || 'a restaurant'}.`,
      data: { orderId: order._id }
    });

    // Send real-time notification to rider
    socketService.sendNotification(riderId, {
      type: 'order_status',
      title: 'New Delivery Assigned',
      message: `You have been assigned to deliver order #${order.orderNumber} from ${restaurant?.name || 'a restaurant'}.`,
      orderId: order._id
    });

    // Emit live update for the current order
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

    const filteredOrders = orders.map(order => stripFinancialsForRider(order));

    res.status(200).json({
      success: true,
      count: orders.length,
      data: filteredOrders
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

    const filteredOrders = orders.map(order => stripFinancialsForRider(order));

    res.status(200).json({
      success: true,
      count: orders.length,
      data: filteredOrders
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

    // Persistent Notification for Customer
    const Notification = require('../models/Notification');
    await Notification.create({
      user: order.customer,
      type: 'order_status',
      title: 'Rider Picked Up Your Order',
      message: `${req.user.username} is on their way with your food!`,
      data: { orderId: order._id }
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
      'picked_up': ['on_the_way', 'delivered'],  // Allow direct to delivered or via on_the_way
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
    const isLinkedParent = req.user.role === 'customer'
      && await User.exists({ _id: order.customer, role: 'child', parentAccount: req.user._id });
    const isAdmin = req.user.role === 'admin';

    if (!isCustomer && !isLinkedParent && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to cancel this order'
      });
    }

    // Order modification window check (2 minutes)
    const orderTime = new Date(order.createdAt).getTime();
    const currentTime = new Date().getTime();
    const diffInMinutes = (currentTime - orderTime) / (1000 * 60);

    if ((isCustomer || isLinkedParent) && diffInMinutes > 2) {
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

/**
 * @desc    Get all orders (Admin)
 * @route   GET /api/orders/admin
 * @access  Private (Admin)
 */
exports.getAllOrders = async (req, res) => {
  try {
    const { status, search, page = 1, limit = 20 } = req.query;

    let query = {};

    if (status) query.status = status;
    if (search) {
      query.$or = [
        { orderNumber: { $regex: search, $options: 'i' } }
      ];
    }

    const orders = await Order.find(query)
      .populate('customer', 'username email phone')
      .populate('restaurant', 'name logoUrl')
      .populate('deliveryRider', 'username profilePicture')
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
 * @desc    Trigger SOS for an order
 * @route   POST /api/orders/:id/sos
 * @access  Private (Delivery Staff)
 */
exports.triggerSOS = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    if (order.deliveryRider?.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to trigger SOS for this order'
      });
    }

    order.sosStatus = 'active';
    await order.save();

    // Notify Admins via Socket
    const io = socketService.getIO();
    io.to('admin').emit('sosAlert', {
      orderId: order._id,
      orderNumber: order.orderNumber,
      riderName: req.user.username,
      location: order.riderLocationHistory[order.riderLocationHistory.length - 1]
    });

    res.status(200).json({
      success: true,
      message: 'SOS triggered. Help is on the way.',
      data: order
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to trigger SOS',
      error: error.message
    });
  }
};

/**
 * @desc    Update rider location
 * @route   POST /api/orders/:id/location
 * @access  Private (Delivery Staff)
 */
exports.updateRiderLocation = async (req, res) => {
  try {
    const { lat, lng } = req.body;
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    if (order.deliveryRider?.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    order.riderLocationHistory.push({ lat, lng });
    await order.save();

    // Broadcast location update to customer
    socketService.emitOrderUpdate(order._id.toString(), order.status, {
      location: { lat, lng }
    });

    res.status(200).json({ success: true, message: 'Location updated' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * @desc    Get order pools (orders from same restaurant that are ready)
 * @route   GET /api/orders/pools
 * @access  Private (Delivery Staff)
 */
exports.getPoolableOrders = async (req, res) => {
  try {
    // Group ready orders by restaurant
    const pools = await Order.aggregate([
      { $match: { status: 'ready', deliveryRider: null } },
      {
        $group: {
          _id: '$restaurant',
          count: { $sum: 1 },
          orders: { $push: '$$ROOT' }
        }
      },
      { $match: { count: { $gt: 1 } } } // Pools are restaurants with >1 ready order
    ]);

    // Populate restaurant details for each pool
    const populatedPools = await Order.populate(pools, { path: '_id', select: 'name address', model: 'Restaurant' });

    res.status(200).json({
      success: true,
      data: populatedPools
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * @desc    Clear order history for user (soft-delete)
 * @route   PUT /api/orders/clear-history
 * @access  Private (Customer)
 */
exports.clearOrderHistory = async (req, res) => {
  try {
    // Only clear orders that are 'delivered' or 'cancelled'
    const result = await Order.updateMany(
      {
        customer: req.user._id,
        status: { $in: ['delivered', 'cancelled'] },
        isHiddenForCustomer: { $ne: true }
      },
      { $set: { isHiddenForCustomer: true } }
    );

    res.status(200).json({
      success: true,
      message: 'Order history cleared successfully',
      data: {
        modifiedCount: result.modifiedCount
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to clear order history',
      error: error.message
    });
  }
};
