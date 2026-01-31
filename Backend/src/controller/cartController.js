const Cart = require('../models/Cart');
const Menu = require('../models/Menu');
const Restaurant = require('../models/Restaurant');
const PromoCode = require('../models/PromoCode');

/**
 * @desc    Get user's cart
 * @route   GET /api/cart
 * @access  Private
 */
exports.getCart = async (req, res) => {
  try {
    let cart = await Cart.findOne({ user: req.user._id })
      .populate('restaurant', 'name logoUrl')
      .populate('items.menuItem', 'name price image isAvailable');

    if (!cart) {
      cart = { items: [], subtotal: 0, itemCount: 0 };
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
    let cart = await Cart.findOne({ user: req.user._id });

    if (!cart) {
      cart = new Cart({
        user: req.user._id,
        restaurant: menuItem.restaurant,
        items: []
      });
    } else {
      // Check if adding from different restaurant
      if (cart.restaurant && cart.restaurant.toString() !== menuItem.restaurant.toString()) {
        return res.status(400).json({
          success: false,
          message: 'You can only order from one restaurant at a time. Clear your cart first.',
          requiresClear: true
        });
      }
    }

    // Check if item already exists in cart
    const existingItemIndex = cart.items.findIndex(
      item => item.menuItem.toString() === menuItemId
    );

    if (existingItemIndex > -1) {
      // Update quantity
      cart.items[existingItemIndex].quantity += quantity;
      if (specialInstructions) {
        cart.items[existingItemIndex].specialInstructions = specialInstructions;
      }
    } else {
      // Add new item
      cart.items.push({
        menuItem: menuItemId,
        name: menuItem.name,
        price: menuItem.price,
        image: menuItem.image,
        quantity,
        specialInstructions
      });
    }

    cart.restaurant = menuItem.restaurant;
    await cart.save();

    // Populate and return
    const populatedCart = await Cart.findById(cart._id)
      .populate('restaurant', 'name logoUrl')
      .populate('items.menuItem', 'name price image');

    res.status(200).json({
      success: true,
      message: 'Item added to cart',
      data: populatedCart
    });
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

    const itemIndex = cart.items.findIndex(
      item => item.menuItem.toString() === menuItemId
    );

    if (itemIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Item not found in cart'
      });
    }

    if (quantity <= 0) {
      // Remove item
      cart.items.splice(itemIndex, 1);
    } else {
      cart.items[itemIndex].quantity = quantity;
      if (specialInstructions !== undefined) {
        cart.items[itemIndex].specialInstructions = specialInstructions;
      }
    }

    // Clear restaurant if cart is empty
    if (cart.items.length === 0) {
      cart.restaurant = null;
      cart.promoCode = null;
      cart.promoDiscount = 0;
    }

    await cart.save();

    const populatedCart = await Cart.findById(cart._id)
      .populate('restaurant', 'name logoUrl')
      .populate('items.menuItem', 'name price image');

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

    cart.items = cart.items.filter(
      item => item.menuItem.toString() !== menuItemId
    );

    // Clear restaurant if cart is empty
    if (cart.items.length === 0) {
      cart.restaurant = null;
      cart.promoCode = null;
      cart.promoDiscount = 0;
    }

    await cart.save();

    const populatedCart = await Cart.findById(cart._id)
      .populate('restaurant', 'name logoUrl')
      .populate('items.menuItem', 'name price image');

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

    if (!cart || cart.items.length === 0) {
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
    const subtotal = cart.items.reduce((total, item) => total + (item.price * item.quantity), 0);

    // Validate promo code
    const validation = promoCode.isValid(subtotal, cart.restaurant);

    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        message: validation.message
      });
    }

    // Calculate discount
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
      .populate('restaurant', 'name logoUrl address');

    if (!cart || cart.items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Cart is empty'
      });
    }

    const subtotal = cart.items.reduce((total, item) => total + (item.price * item.quantity), 0);
    const deliveryFee = 50;
    const serviceFee = 20;
    const discount = cart.promoDiscount || 0;
    const total = subtotal + deliveryFee + serviceFee - discount;

    res.status(200).json({
      success: true,
      data: {
        restaurant: cart.restaurant,
        items: cart.items,
        itemCount: cart.items.reduce((count, item) => count + item.quantity, 0),
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
