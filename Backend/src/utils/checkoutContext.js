const Cart = require('../models/Cart');
const User = require('../models/User');

const buildCheckoutError = (message, statusCode = 400, code) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  error.code = code;
  return error;
};

const loadCartForCheckout = async (reqUser, childCartId, options = {}) => {
  const { populateMenuItems = false } = options;

  if (!reqUser) {
    throw buildCheckoutError('Not authorized', 401, 'AUTH_REQUIRED');
  }

  if (reqUser.role === 'child') {
    throw buildCheckoutError(
      'Child accounts cannot complete payment. Your parent must pay from their account.',
      403,
      'CHILD_PAYMENT_NOT_ALLOWED'
    );
  }

  if (childCartId) {
    if (reqUser.role !== 'customer') {
      throw buildCheckoutError('Only parent accounts can pay for a child cart.', 403, 'PARENT_CHECKOUT_ONLY');
    }

    let cartQuery = Cart.findById(childCartId);
    if (populateMenuItems) {
      cartQuery = cartQuery.populate('restaurantGroups.items.menuItem');
    }

    const cart = await cartQuery;
    if (!cart) {
      throw buildCheckoutError('Child cart not found', 404, 'CHILD_CART_NOT_FOUND');
    }

    const cartOwner = await User.findOne({
      _id: cart.user,
      role: 'child',
      parentAccount: reqUser._id
    });

    if (!cartOwner) {
      throw buildCheckoutError(
        'You are not authorized to manage this child cart.',
        403,
        'CHILD_CART_NOT_ACCESSIBLE'
      );
    }

    if ((cart.parentApproval?.status || 'not_required') !== 'approved') {
      throw buildCheckoutError(
        'This child cart must be approved before payment.',
        403,
        'CHILD_PARENT_APPROVAL_REQUIRED'
      );
    }

    return {
      cart,
      cartOwner,
      payer: reqUser,
      isParentCheckout: true
    };
  }

  let cartQuery = Cart.findOne({ user: reqUser._id });
  if (populateMenuItems) {
    cartQuery = cartQuery.populate('restaurantGroups.items.menuItem');
  }

  const cart = await cartQuery;
  const cartOwner = await User.findById(reqUser._id);

  return {
    cart,
    cartOwner,
    payer: reqUser,
    isParentCheckout: false
  };
};

module.exports = {
  buildCheckoutError,
  loadCartForCheckout
};
