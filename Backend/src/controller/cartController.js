const Cart = require('../models/Cart');
const Menu = require('../models/Menu');
const Restaurant = require('../models/Restaurant');
const PromoCode = require('../models/PromoCode');
const User = require('../models/User');
const Notification = require('../models/Notification');
const { getIO } = require('../services/socket');
const { sendNotification } = require('../services/socket');
const crypto = require('crypto');
const {
  getRestrictionReasonsForMenuItem
} = require('../utils/childAccountControls');
const { notifyParentOfChildActivity } = require('../utils/childActivityNotifier');

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

const buildChildCartRequestData = (cart, child) => {
  const itemCount = (cart.restaurantGroups || []).reduce((count, group) => {
    return count + (group.items || []).reduce((groupCount, item) => groupCount + Number(item.quantity || 0), 0);
  }, 0);

  const subtotal = (cart.restaurantGroups || []).reduce((sum, group) => {
    return sum + (group.items || []).reduce((groupSum, item) => {
      return groupSum + (Number(item.price || 0) * Number(item.quantity || 0));
    }, 0);
  }, 0);

  return {
    _id: cart._id,
    child: {
      _id: child?._id,
      username: child?.username,
      email: child?.email,
      displayName: child?.childProfile?.displayName,
      profilePicture: child?.profilePicture
    },
    restaurantGroups: cart.restaurantGroups,
    itemCount,
    subtotal,
    promoCode: cart.promoCode,
    promoDiscount: cart.promoDiscount || 0,
    requestedAt: cart.parentApproval?.requestedAt,
    reviewedAt: cart.parentApproval?.reviewedAt,
    parentApproval: {
      status: cart.parentApproval?.status || 'not_required',
      requestedAt: cart.parentApproval?.requestedAt,
      reviewedAt: cart.parentApproval?.reviewedAt,
      reviewedBy: cart.parentApproval?.reviewedBy,
      note: cart.parentApproval?.note || ''
    }
  };
};

const getParentManagedChildCart = async (parentId, cartId, options = {}) => {
  const { requireApproved = false } = options;

  const cart = await Cart.findById(cartId)
    .populate('restaurantGroups.restaurant', 'name logoUrl')
    .populate('restaurantGroups.items.menuItem', 'name price image isAvailable');

  if (!cart) {
    const error = new Error('Cart request not found');
    error.statusCode = 404;
    throw error;
  }

  const child = await User.findOne({
    _id: cart.user,
    role: 'child',
    parentAccount: parentId
  }).select('_id username email profilePicture childProfile.displayName');

  if (!child) {
    const error = new Error('You are not authorized to access this child cart');
    error.statusCode = 403;
    throw error;
  }

  const approvalStatus = cart.parentApproval?.status || 'not_required';
  if (!['pending_parent_approval', 'approved'].includes(approvalStatus)) {
    const error = new Error('This child cart is not available for parent review');
    error.statusCode = 400;
    throw error;
  }

  if (requireApproved && approvalStatus !== 'approved') {
    const error = new Error('This child cart must be approved before you can modify it');
    error.statusCode = 400;
    throw error;
  }

  return { cart, child };
};

/**
 * @desc    Get user's cart
 * @route   GET /api/cart
 * @access  Private
 */
exports.getCart = async (req, res) => {
  try {
    // Find cart where user is owner OR collaborator
    let cart = await Cart.findOne({
      $or: [
        { user: req.user._id },
        { collaborators: req.user._id }
      ]
    })
      .populate('restaurantGroups.restaurant', 'name logoUrl')
      .populate('restaurantGroups.items.menuItem', 'name price image isAvailable')
      .populate('collaborators', 'username profilePicture')
      .populate('user', 'username profilePicture');

    if (!cart) {
      cart = { restaurantGroups: [], subtotal: 0, itemCount: 0 };
    }

    res.status(200).json({
      success: true,
      data: cart
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch cart',
      error: error.message
    });
  }
};

/**
 * @desc    Add item to cart
 * @route   POST /api/cart/add
 * @access  Private
 */
exports.addToCart = async (req, res) => {
  try {
    const { menuItemId, quantity = 1, specialInstructions } = req.body;

    // Get menu item
    const menuItem = await Menu.findById(menuItemId);

    if (!menuItem) {
      return res.status(404).json({
        success: false,
        message: 'Menu item not found'
      });
    }

    if (!menuItem.isAvailable) {
      return res.status(400).json({
        success: false,
        message: 'Menu item is not available'
      });
    }

    const restrictionReasons = getRestrictionReasonsForMenuItem(menuItem, req.user);
    if (restrictionReasons.length > 0) {
      if (req.user?.role === 'child') {
        try {
          await notifyParentOfChildActivity(req.user, {
            title: 'Blocked Child Food Attempt',
            message: `${req.user.username} tried to add "${menuItem.name}" to the cart, but it was blocked by parental controls.`,
            link: '/cart'
          });
        } catch (notificationError) {
          console.error('Failed to notify parent about blocked child food attempt:', notificationError.message);
        }
      }

      return res.status(403).json({
        success: false,
        message: restrictionReasons[0],
        code: 'CHILD_MENU_ITEM_RESTRICTED'
      });
    }

    // Find or create cart
    // Find cart where user is owner OR collaborator
    let cart = await Cart.findOne({
      $or: [
        { user: req.user._id },
        { collaborators: req.user._id }
      ]
    });

    if (!cart) {
      cart = new Cart({
        user: req.user._id,
        restaurantGroups: []
      });
    }

    // Single-restaurant rule: reject if cart already has items from a different restaurant
    const hasOtherRestaurant = cart.restaurantGroups.length > 0 &&
      !cart.restaurantGroups.some(
        group => group.restaurant.toString() === menuItem.restaurant.toString()
      );

    if (hasOtherRestaurant) {
      const existingRestaurant = await Restaurant.findById(cart.restaurantGroups[0].restaurant).select('name');
      return res.status(409).json({
        success: false,
        code: 'DIFFERENT_RESTAURANT',
        message: `Your cart already has items from ${existingRestaurant?.name || 'another restaurant'}. Clear your cart first to add items from a new restaurant.`,
        existingRestaurant: existingRestaurant?.name || 'another restaurant'
      });
    }

    // Find if restaurant group already exists
    let groupIndex = cart.restaurantGroups.findIndex(
      group => group.restaurant.toString() === menuItem.restaurant.toString()
    );

    if (groupIndex === -1) {
      // Create new restaurant group
      cart.restaurantGroups.push({
        restaurant: menuItem.restaurant,
        items: [{
          menuItem: menuItemId,
          name: menuItem.name,
          price: menuItem.price,
          image: menuItem.image,
          quantity,
          specialInstructions,
          addedBy: req.user._id
        }]
      });
    } else {
      // Check if item already exists in that group
      const existingItemIndex = cart.restaurantGroups[groupIndex].items.findIndex(
        item => item.menuItem.toString() === menuItemId
      );

      if (existingItemIndex > -1) {
        // Update quantity
        cart.restaurantGroups[groupIndex].items[existingItemIndex].quantity += quantity;
        if (specialInstructions !== undefined) {
          cart.restaurantGroups[groupIndex].items[existingItemIndex].specialInstructions = specialInstructions;
        }
      } else {
        // Add new item to group
        cart.restaurantGroups[groupIndex].items.push({
          menuItem: menuItemId,
          name: menuItem.name,
          price: menuItem.price,
          image: menuItem.image,
          quantity,
          specialInstructions,
          addedBy: req.user._id
        });
      }
    }

    resetChildApprovalOnCartMutation(cart, req.user);
    await cart.save();

    // Populate and return
    const populatedCart = await Cart.findById(cart._id)
      .populate('restaurantGroups.restaurant', 'name logoUrl')
      .populate('restaurantGroups.items.menuItem', 'name price image');

    res.status(200).json({
      success: true,
      message: 'Item added to cart',
      data: populatedCart
    });

    // Broadcast update if shared
    if (populatedCart.isShared) {
      const io = getIO();
      io.to(populatedCart.shareCode).emit('cartUpdated', populatedCart);
    }
  } catch (error) {
    res.status(error.statusCode || 500).json({
      success: false,
      message: 'Failed to add item to cart',
      error: error.message,
      code: error.code,
      details: error.details
    });
  }
};

/**
 * @desc    Update cart item quantity
 * @route   PUT /api/cart/update
 * @access  Private
 */
exports.updateCartItem = async (req, res) => {
  try {
    const { menuItemId, quantity, specialInstructions } = req.body;

    const cart = await Cart.findOne({ user: req.user._id });

    if (!cart) {
      return res.status(404).json({
        success: false,
        message: 'Cart not found'
      });
    }

    let itemFound = false;

    for (let i = 0; i < cart.restaurantGroups.length; i++) {
      const itemIndex = cart.restaurantGroups[i].items.findIndex(
        item => item.menuItem.toString() === menuItemId
      );

      if (itemIndex > -1) {
        const currentQuantity = cart.restaurantGroups[i].items[itemIndex].quantity;
        if (quantity > currentQuantity) {
          const menuItem = await Menu.findById(menuItemId);
          const restrictionReasons = getRestrictionReasonsForMenuItem(menuItem, req.user);
          if (restrictionReasons.length > 0) {
            return res.status(403).json({
              success: false,
              message: restrictionReasons[0],
              code: 'CHILD_MENU_ITEM_RESTRICTED'
            });
          }
        }

        if (quantity <= 0) {
          cart.restaurantGroups[i].items.splice(itemIndex, 1);
          // If group is now empty, remove it
          if (cart.restaurantGroups[i].items.length === 0) {
            cart.restaurantGroups.splice(i, 1);
          }
        } else {
          cart.restaurantGroups[i].items[itemIndex].quantity = quantity;
          if (specialInstructions !== undefined) {
            cart.restaurantGroups[i].items[itemIndex].specialInstructions = specialInstructions;
          }
        }
        itemFound = true;
        break;
      }
    }

    if (!itemFound) {
      return res.status(404).json({
        success: false,
        message: 'Item not found in cart'
      });
    }

    resetChildApprovalOnCartMutation(cart, req.user);
    await cart.save();

    const populatedCart = await Cart.findById(cart._id)
      .populate('restaurantGroups.restaurant', 'name logoUrl')
      .populate('restaurantGroups.items.menuItem', 'name price image');

    res.status(200).json({
      success: true,
      message: 'Cart updated',
      data: populatedCart
    });
  } catch (error) {
    res.status(error.statusCode || 500).json({
      success: false,
      message: 'Failed to update cart',
      error: error.message,
      code: error.code,
      details: error.details
    });
  }
};

/**
 * @desc    Remove item from cart
 * @route   DELETE /api/cart/remove/:menuItemId
 * @access  Private
 */
exports.removeFromCart = async (req, res) => {
  try {
    const { menuItemId } = req.params;

    const cart = await Cart.findOne({ user: req.user._id });

    if (!cart) {
      return res.status(404).json({
        success: false,
        message: 'Cart not found'
      });
    }

    let itemRemoved = false;
    for (let i = 0; i < cart.restaurantGroups.length; i++) {
      const initialLength = cart.restaurantGroups[i].items.length;
      cart.restaurantGroups[i].items = cart.restaurantGroups[i].items.filter(
        item => item.menuItem.toString() !== menuItemId
      );

      if (cart.restaurantGroups[i].items.length < initialLength) {
        itemRemoved = true;
        if (cart.restaurantGroups[i].items.length === 0) {
          cart.restaurantGroups.splice(i, 1);
        }
        break;
      }
    }

    if (!itemRemoved) {
      return res.status(404).json({
        success: false,
        message: 'Item not found in cart'
      });
    }

    resetChildApprovalOnCartMutation(cart, req.user);
    await cart.save();

    const populatedCart = await Cart.findById(cart._id)
      .populate('restaurantGroups.restaurant', 'name logoUrl')
      .populate('restaurantGroups.items.menuItem', 'name price image');

    res.status(200).json({
      success: true,
      message: 'Item removed from cart',
      data: populatedCart
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to remove item from cart',
      error: error.message
    });
  }
};

/**
 * @desc    Clear cart
 * @route   DELETE /api/cart/clear
 * @access  Private
 */
exports.clearCart = async (req, res) => {
  try {
    await Cart.findOneAndDelete({ user: req.user._id });

    res.status(200).json({
      success: true,
      message: 'Cart cleared successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to clear cart',
      error: error.message
    });
  }
};

/**
 * @desc    Apply promo code to cart
 * @route   POST /api/cart/apply-promo
 * @access  Private
 */
exports.applyPromoCode = async (req, res) => {
  try {
    const { code } = req.body;

    if (req.user.role === 'child') {
      return res.status(403).json({
        success: false,
        message: 'Promo codes are not available for child accounts',
        code: 'CHILD_PROMO_CODE_NOT_ALLOWED'
      });
    }

    const cart = await Cart.findOne({ user: req.user._id });

    if (!cart || cart.restaurantGroups.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Cart is empty'
      });
    }

    const promoCode = await PromoCode.findOne({ code: code.toUpperCase() });

    if (!promoCode) {
      return res.status(404).json({
        success: false,
        message: 'Invalid promo code'
      });
    }

    // Calculate subtotal
    let subtotal = 0;
    cart.restaurantGroups.forEach(group => {
      group.items.forEach(item => {
        subtotal += item.price * item.quantity;
      });
    });

    // Validate promo code
    // Note: If multi-restaurant, promo code might apply to specific restaurant or entire cart.
    // For now, we allow it if it matches criteria and restaurant index check.
    const validation = promoCode.isValid(subtotal, cart.restaurantGroups[0].restaurant); // Check against first restaurant for now

    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        message: validation.message
      });
    }

    const discount = promoCode.calculateDiscount(subtotal);

    cart.promoCode = code.toUpperCase();
    cart.promoDiscount = discount;
    resetChildApprovalOnCartMutation(cart, req.user);
    await cart.save();

    res.status(200).json({
      success: true,
      message: 'Promo code applied successfully',
      data: {
        code: cart.promoCode,
        discount: cart.promoDiscount
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to apply promo code',
      error: error.message
    });
  }
};

/**
 * @desc    Remove promo code from cart
 * @route   DELETE /api/cart/remove-promo
 * @access  Private
 */
exports.removePromoCode = async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.user._id });

    if (!cart) {
      return res.status(404).json({
        success: false,
        message: 'Cart not found'
      });
    }

    cart.promoCode = null;
    cart.promoDiscount = 0;
    resetChildApprovalOnCartMutation(cart, req.user);
    await cart.save();

    res.status(200).json({
      success: true,
      message: 'Promo code removed'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to remove promo code',
      error: error.message
    });
  }
};

/**
 * @desc    Get cart summary (for checkout)
 * @route   GET /api/cart/summary
 * @access  Private
 */
exports.getCartSummary = async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.user._id })
      .populate('restaurantGroups.restaurant', 'name logoUrl address');

    if (!cart || cart.restaurantGroups.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Cart is empty'
      });
    }

    let subtotal = 0;
    let itemCount = 0;

    cart.restaurantGroups.forEach(group => {
      group.items.forEach(item => {
        subtotal += item.price * item.quantity;
        itemCount += item.quantity;
      });
    });

    // Multi-restaurant delivery fee: Rs. 50 per restaurant
    const deliveryFee = cart.restaurantGroups.length * 50;
    const serviceFee = 20;
    const discount = cart.promoDiscount || 0;
    const total = subtotal + deliveryFee + serviceFee - discount;

    res.status(200).json({
      success: true,
      data: {
        restaurantGroups: cart.restaurantGroups,
        itemCount,
        pricing: {
          subtotal,
          deliveryFee,
          serviceFee,
          discount,
          total
        },
        promoCode: cart.promoCode
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to get cart summary',
      error: error.message
    });
  }
};

/**
 * @desc    Create a shared cart
 * @route   POST /api/cart/share
 * @access  Private
 */
exports.createSharedCart = async (req, res) => {
  try {
    let cart = await Cart.findOne({ user: req.user._id });

    if (!cart) {
      cart = new Cart({ user: req.user._id, restaurantGroups: [] });
    }

    if (cart.isShared) {
      return res.status(200).json({
        success: true,
        message: 'Cart is already shared',
        data: cart
      });
    }

    cart.isShared = true;
    cart.shareCode = crypto.randomBytes(4).toString('hex').toUpperCase(); // 8 char code
    await cart.save();

    res.status(200).json({
      success: true,
      message: 'Shared cart created',
      data: cart
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to create shared cart',
      error: error.message
    });
  }
};

/**
 * @desc    Join a shared cart
 * @route   POST /api/cart/join
 * @access  Private
 */
exports.joinSharedCart = async (req, res) => {
  try {
    const { shareCode } = req.body;

    const cart = await Cart.findOne({ shareCode: shareCode.toUpperCase() });

    if (!cart) {
      return res.status(404).json({
        success: false,
        message: 'Shared cart not found'
      });
    }

    // Check if user is already a collaborator or owner
    if (cart.user.toString() === req.user._id.toString() || cart.collaborators.includes(req.user._id)) {
      return res.status(200).json({
        success: true,
        message: 'Already in this cart',
        data: cart
      });
    }

    // Add as collaborator
    cart.collaborators.push(req.user._id);
    await cart.save();

    const populatedCart = await Cart.findById(cart._id)
      .populate('restaurantGroups.restaurant', 'name logoUrl')
      .populate('restaurantGroups.items.menuItem', 'name price image')
      .populate('collaborators', 'username profilePicture')
      .populate('user', 'username profilePicture');

    // Notify others
    const io = getIO();
    io.to(shareCode).emit('userJoinedCart', {
      user: { _id: req.user._id, username: req.user.username },
      cart: populatedCart
    });

    res.status(200).json({
      success: true,
      message: 'Joined shared cart successfully',
      data: populatedCart
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to join shared cart',
      error: error.message
    });
  }
};

/**
 * @desc    Child submits cart for parent approval
 * @route   POST /api/cart/request-parent-approval
 * @access  Private (Child)
 */
exports.requestParentApproval = async (req, res) => {
  try {
    if (req.user.role !== 'child') {
      return res.status(403).json({
        success: false,
        message: 'Only child accounts can request parent approval'
      });
    }

    if (!req.user.parentAccount) {
      return res.status(400).json({
        success: false,
        message: 'No parent account is linked to this child account'
      });
    }

    const cart = await Cart.findOne({ user: req.user._id })
      .populate('restaurantGroups.restaurant', 'name logoUrl');

    if (!cart || (cart.restaurantGroups || []).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Cart is empty'
      });
    }

    if (cart.parentApproval?.status === 'approved') {
      return res.status(200).json({
        success: true,
        message: 'Your cart is already approved by your parent.',
        data: {
          status: cart.parentApproval.status,
          requestedAt: cart.parentApproval.requestedAt,
          reviewedAt: cart.parentApproval.reviewedAt
        }
      });
    }

    if (cart.parentApproval?.status === 'pending_parent_approval') {
      return res.status(200).json({
        success: true,
        message: 'Your cart is already waiting for your parent approval.',
        data: {
          status: cart.parentApproval.status,
          requestedAt: cart.parentApproval.requestedAt
        }
      });
    }

    const parent = await User.findOne({ _id: req.user.parentAccount, role: 'customer' }).select('_id username');
    if (!parent) {
      return res.status(404).json({
        success: false,
        message: 'Linked parent account was not found'
      });
    }

    cart.parentApproval = {
      ...cart.parentApproval,
      status: 'pending_parent_approval',
      requestedAt: new Date(),
      reviewedAt: null,
      reviewedBy: null,
      note: ''
    };
    await cart.save();

    const title = 'Child Cart Approval Request';
    const message = `${req.user.username} sent a cart request for your approval.`;

    await Notification.create({
      user: parent._id,
      type: 'system',
      title,
      message,
      data: {
        link: '/cart'
      }
    });

    sendNotification(parent._id, {
      type: 'system',
      title,
      message,
      link: '/cart'
    });

    return res.status(200).json({
      success: true,
      message: 'Your cart has been sent to your parent for approval.',
      data: {
        status: cart.parentApproval.status,
        requestedAt: cart.parentApproval.requestedAt
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to submit cart for parent approval',
      error: error.message
    });
  }
};

/**
 * @desc    Parent gets child cart requests that still need parent action or payment
 * @route   GET /api/cart/child-requests
 * @access  Private (Parent)
 */
exports.getChildCartRequests = async (req, res) => {
  try {
    if (req.user.role !== 'customer') {
      return res.status(403).json({
        success: false,
        message: 'Only parent accounts can view child cart requests'
      });
    }

    const children = await User.find({ parentAccount: req.user._id, role: 'child' })
      .select('_id username email profilePicture childProfile.displayName');
    const childIds = children.map((child) => child._id);

    if (childIds.length === 0) {
      return res.status(200).json({ success: true, data: [] });
    }

    const childMap = new Map(children.map((child) => [child._id.toString(), child]));

    const carts = await Cart.find({
      user: { $in: childIds },
      'parentApproval.status': { $in: ['pending_parent_approval', 'approved'] }
    })
      .populate('restaurantGroups.restaurant', 'name logoUrl')
      .sort({ updatedAt: -1 });

    const statusPriority = {
      pending_parent_approval: 0,
      approved: 1
    };

    const data = carts
      .map((cart) => {
        const child = childMap.get(cart.user.toString());
        return buildChildCartRequestData(cart, child);
      })
      .sort((a, b) => {
        const priorityDiff = statusPriority[a.parentApproval.status] - statusPriority[b.parentApproval.status];
        if (priorityDiff !== 0) {
          return priorityDiff;
        }

        const aTime = new Date(a.reviewedAt || a.requestedAt || 0).getTime();
        const bTime = new Date(b.reviewedAt || b.requestedAt || 0).getTime();
        return bTime - aTime;
      });

    return res.status(200).json({ success: true, data });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch child cart requests',
      error: error.message
    });
  }
};

/**
 * @desc    Parent gets a single child cart request
 * @route   GET /api/cart/child-requests/:cartId
 * @access  Private (Parent)
 */
exports.getChildCartRequestById = async (req, res) => {
  try {
    if (req.user.role !== 'customer') {
      return res.status(403).json({
        success: false,
        message: 'Only parent accounts can view child cart requests'
      });
    }

    const { cart, child } = await getParentManagedChildCart(req.user._id, req.params.cartId);

    return res.status(200).json({
      success: true,
      data: buildChildCartRequestData(cart, child)
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.statusCode ? error.message : 'Failed to fetch child cart request',
      error: error.message
    });
  }
};

/**
 * @desc    Parent approves child cart request
 * @route   PUT /api/cart/child-requests/:cartId/approve
 * @access  Private (Parent)
 */
exports.approveChildCartRequest = async (req, res) => {
  try {
    if (req.user.role !== 'customer') {
      return res.status(403).json({
        success: false,
        message: 'Only parent accounts can approve child cart requests'
      });
    }

    const { cartId } = req.params;
    const { note = '' } = req.body || {};

    const cart = await Cart.findById(cartId);
    if (!cart) {
      return res.status(404).json({ success: false, message: 'Cart request not found' });
    }

    const child = await User.findOne({ _id: cart.user, role: 'child', parentAccount: req.user._id }).select('_id username');
    if (!child) {
      return res.status(403).json({ success: false, message: 'You are not authorized to review this child cart' });
    }

    if (cart.parentApproval?.status !== 'pending_parent_approval') {
      return res.status(400).json({ success: false, message: 'This cart is not pending parent approval' });
    }

    cart.parentApproval = {
      ...cart.parentApproval,
      status: 'approved',
      reviewedAt: new Date(),
      reviewedBy: req.user._id,
      note: String(note || '').trim()
    };
    await cart.save();

    const title = 'Cart Request Approved';
    const message = 'Your parent approved your cart request and can now review and pay from their account.';

    await Notification.create({
      user: child._id,
      type: 'system',
      title,
      message,
      data: { link: '/cart' }
    });
    sendNotification(child._id, { type: 'system', title, message, link: '/cart' });

    return res.status(200).json({
      success: true,
      message: 'Child cart request approved',
      data: {
        cartId: cart._id,
        status: cart.parentApproval.status,
        reviewedAt: cart.parentApproval.reviewedAt
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to approve child cart request',
      error: error.message
    });
  }
};

/**
 * @desc    Parent updates quantities in an approved child cart
 * @route   PUT /api/cart/child-requests/:cartId/items
 * @access  Private (Parent)
 */
exports.addItemToChildCartRequest = async (req, res) => {
  try {
    if (req.user.role !== 'customer') {
      return res.status(403).json({
        success: false,
        message: 'Only parent accounts can modify child carts'
      });
    }

    const { menuItemId, quantity = 1, specialInstructions } = req.body || {};
    if (!menuItemId || typeof quantity !== 'number' || quantity < 1) {
      return res.status(400).json({
        success: false,
        message: 'menuItemId and a quantity of at least 1 are required'
      });
    }

    const { cart, child } = await getParentManagedChildCart(req.user._id, req.params.cartId, {
      requireApproved: true
    });

    const menuItem = await Menu.findById(menuItemId);
    if (!menuItem || menuItem.isAvailable === false) {
      return res.status(400).json({
        success: false,
        message: 'Menu item is not available'
      });
    }

    const restrictionReasons = getRestrictionReasonsForMenuItem(menuItem, child);
    if (restrictionReasons.length > 0) {
      return res.status(403).json({
        success: false,
        message: restrictionReasons[0],
        code: 'CHILD_MENU_ITEM_RESTRICTED'
      });
    }

    const targetRestaurantId = getEntityIdString(menuItem.restaurant);
    const groupIndex = cart.restaurantGroups.findIndex(
      (group) => getEntityIdString(group.restaurant) === targetRestaurantId
    );

    if (cart.restaurantGroups.length > 0 && groupIndex === -1) {
      return res.status(400).json({
        success: false,
        message: 'Parents can only add items from the same restaurant to this approved child cart.',
        code: 'CHILD_CART_RESTAURANT_MISMATCH'
      });
    }

    if (groupIndex === -1) {
      cart.restaurantGroups.push({
        restaurant: menuItem.restaurant,
        items: [{
          menuItem: menuItemId,
          name: menuItem.name,
          price: menuItem.price,
          image: menuItem.image,
          quantity,
          specialInstructions,
          addedBy: req.user._id
        }]
      });
    } else {
      const itemIndex = cart.restaurantGroups[groupIndex].items.findIndex(
        (item) => getEntityIdString(item.menuItem) === menuItemId
      );

      if (itemIndex > -1) {
        cart.restaurantGroups[groupIndex].items[itemIndex].quantity += quantity;
        if (specialInstructions !== undefined) {
          cart.restaurantGroups[groupIndex].items[itemIndex].specialInstructions = specialInstructions;
        }
      } else {
        cart.restaurantGroups[groupIndex].items.push({
          menuItem: menuItemId,
          name: menuItem.name,
          price: menuItem.price,
          image: menuItem.image,
          quantity,
          specialInstructions,
          addedBy: req.user._id
        });
      }
    }

    await cart.save();

    const refreshedCart = await Cart.findById(cart._id)
      .populate('restaurantGroups.restaurant', 'name logoUrl')
      .populate('restaurantGroups.items.menuItem', 'name price image isAvailable');

    return res.status(200).json({
      success: true,
      message: 'Item added to child cart',
      data: buildChildCartRequestData(refreshedCart, child)
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.statusCode ? error.message : 'Failed to add item to child cart',
      error: error.message,
      code: error.code
    });
  }
};

/**
 * @desc    Parent updates quantities in an approved child cart
 * @route   PUT /api/cart/child-requests/:cartId/items
 * @access  Private (Parent)
 */
exports.updateChildCartRequestItem = async (req, res) => {
  try {
    if (req.user.role !== 'customer') {
      return res.status(403).json({
        success: false,
        message: 'Only parent accounts can modify child carts'
      });
    }

    const { menuItemId, quantity, specialInstructions } = req.body || {};
    if (!menuItemId || typeof quantity !== 'number') {
      return res.status(400).json({
        success: false,
        message: 'menuItemId and quantity are required'
      });
    }

    const { cart, child } = await getParentManagedChildCart(req.user._id, req.params.cartId, {
      requireApproved: true
    });

    let itemFound = false;

    for (let i = 0; i < cart.restaurantGroups.length; i++) {
      const itemIndex = cart.restaurantGroups[i].items.findIndex(
        (item) => getEntityIdString(item.menuItem) === menuItemId
      );

      if (itemIndex === -1) {
        continue;
      }

      itemFound = true;
      const existingItem = cart.restaurantGroups[i].items[itemIndex];

      if (quantity > existingItem.quantity) {
        const menuItem = await Menu.findById(menuItemId);
        if (!menuItem || menuItem.isAvailable === false) {
          return res.status(400).json({
            success: false,
            message: 'Menu item is not available'
          });
        }

        const restrictionReasons = getRestrictionReasonsForMenuItem(menuItem, child);
        if (restrictionReasons.length > 0) {
          return res.status(403).json({
            success: false,
            message: restrictionReasons[0],
            code: 'CHILD_MENU_ITEM_RESTRICTED'
          });
        }
      }

      if (quantity <= 0) {
        cart.restaurantGroups[i].items.splice(itemIndex, 1);
        if (cart.restaurantGroups[i].items.length === 0) {
          cart.restaurantGroups.splice(i, 1);
        }
      } else {
        existingItem.quantity = quantity;
        if (specialInstructions !== undefined) {
          existingItem.specialInstructions = specialInstructions;
        }
      }

      break;
    }

    if (!itemFound) {
      return res.status(404).json({
        success: false,
        message: 'Item not found in child cart'
      });
    }

    await cart.save();

    const refreshedCart = await Cart.findById(cart._id)
      .populate('restaurantGroups.restaurant', 'name logoUrl')
      .populate('restaurantGroups.items.menuItem', 'name price image isAvailable');

    return res.status(200).json({
      success: true,
      message: 'Child cart updated',
      data: buildChildCartRequestData(refreshedCart, child)
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.statusCode ? error.message : 'Failed to update child cart',
      error: error.message,
      code: error.code
    });
  }
};

/**
 * @desc    Parent rejects child cart request
 * @route   PUT /api/cart/child-requests/:cartId/reject
 * @access  Private (Parent)
 */
exports.rejectChildCartRequest = async (req, res) => {
  try {
    if (req.user.role !== 'customer') {
      return res.status(403).json({
        success: false,
        message: 'Only parent accounts can reject child cart requests'
      });
    }

    const { cartId } = req.params;
    const { note = '' } = req.body || {};

    const cart = await Cart.findById(cartId);
    if (!cart) {
      return res.status(404).json({ success: false, message: 'Cart request not found' });
    }

    const child = await User.findOne({ _id: cart.user, role: 'child', parentAccount: req.user._id }).select('_id username');
    if (!child) {
      return res.status(403).json({ success: false, message: 'You are not authorized to review this child cart' });
    }

    if (cart.parentApproval?.status !== 'pending_parent_approval') {
      return res.status(400).json({ success: false, message: 'This cart is not pending parent approval' });
    }

    cart.parentApproval = {
      ...cart.parentApproval,
      status: 'rejected',
      reviewedAt: new Date(),
      reviewedBy: req.user._id,
      note: String(note || '').trim()
    };
    await cart.save();

    const title = 'Cart Request Rejected';
    const parentNote = String(note || '').trim();
    const message = parentNote
      ? `Your parent rejected your cart request: ${parentNote}`
      : 'Your parent rejected your cart request.';

    await Notification.create({
      user: child._id,
      type: 'system',
      title,
      message,
      data: { link: '/cart' }
    });
    sendNotification(child._id, { type: 'system', title, message, link: '/cart' });

    return res.status(200).json({
      success: true,
      message: 'Child cart request rejected',
      data: {
        cartId: cart._id,
        status: cart.parentApproval.status,
        reviewedAt: cart.parentApproval.reviewedAt,
        note: cart.parentApproval.note
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to reject child cart request',
      error: error.message
    });
  }
};
