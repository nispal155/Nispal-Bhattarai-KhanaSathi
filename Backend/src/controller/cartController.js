const Cart = require('../models/Cart');
const Menu = require('../models/Menu');
const Restaurant = require('../models/Restaurant');
const PromoCode = require('../models/PromoCode');
const { getIO } = require('../services/socket');
const crypto = require('crypto');

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
    res.status(500).json({
      success: false,
      message: 'Failed to add item to cart',
      error: error.message
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
    res.status(500).json({
      success: false,
      message: 'Failed to update cart',
      error: error.message
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
