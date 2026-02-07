const PromoCode = require('../models/PromoCode');
const User = require('../models/User');
const Restaurant = require('../models/Restaurant');
const Notification = require('../models/Notification');
const { getIO } = require('../services/socket');

// ============================================================
// HELPER: Check if user can modify a promo code
// ============================================================
const canModifyPromo = (promo, user) => {
  // Super Admin can modify anything
  if (user.role === 'admin') return true;

  // Restaurant Manager can modify only their own offers
  if (user.role === 'restaurant') {
    if (promo.createdByRole === 'admin') return false;
    return promo.createdBy && promo.createdBy.toString() === user._id.toString();
  }

  return false;
};

// ============================================================
// HELPER: Add audit log entry
// ============================================================
const addAuditLog = (promo, action, user, changes = null) => {
  promo.auditLog.push({
    action,
    performedBy: user._id,
    performedByRole: user.role,
    changes,
    timestamp: new Date()
  });
};

/**
 * @desc    Create a new promo code
 * @route   POST /api/promo
 * @access  Private (Admin or Restaurant Manager)
 */
exports.createPromoCode = async (req, res) => {
  try {
    const {
      code, description, discountType, discountValue,
      minOrderAmount, maxDiscount, validFrom, validUntil,
      usageLimit, perUserLimit, applicableRestaurants,
      applicableCategories, scope
    } = req.body;

    // Check if code already exists
    const existingCode = await PromoCode.findOne({ code: code.toUpperCase() });
    if (existingCode) {
      return res.status(400).json({
        success: false,
        message: 'Promo code already exists'
      });
    }

    // Determine scope and restaurant based on role
    let offerScope = 'global';
    let restaurantId = null;
    let restaurants = applicableRestaurants || [];

    if (req.user.role === 'admin') {
      offerScope = scope || 'global';
      if (offerScope === 'restaurant' && restaurants.length > 0) {
        restaurantId = restaurants[0];
      }
    } else if (req.user.role === 'restaurant') {
      const restaurant = await Restaurant.findOne({ createdBy: req.user._id });
      if (!restaurant) {
        return res.status(404).json({
          success: false,
          message: 'Restaurant not found for this user'
        });
      }
      offerScope = 'restaurant';
      restaurantId = restaurant._id;
      restaurants = [restaurant._id];
    }

    const promoCode = new PromoCode({
      code: code.toUpperCase(),
      description,
      discountType,
      discountValue,
      minOrderAmount,
      maxDiscount,
      validFrom,
      validUntil,
      usageLimit,
      perUserLimit,
      scope: offerScope,
      restaurant: restaurantId,
      applicableRestaurants: restaurants,
      applicableCategories,
      isActive: true,
      createdBy: req.user._id,
      createdByRole: req.user.role
    });

    addAuditLog(promoCode, 'created', req.user);
    await promoCode.save();

    res.status(201).json({
      success: true,
      message: 'Promo code created successfully',
      data: promoCode
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to create promo code',
      error: error.message
    });
  }
};

/**
 * @desc    Get all promo codes (role-aware)
 * @route   GET /api/promo
 * @access  Private (Admin or Restaurant Manager)
 */
exports.getAllPromoCodes = async (req, res) => {
  try {
    const { active, expired } = req.query;
    const now = new Date();

    let query = {};

    if (active === 'true') {
      query.isActive = true;
      query.validUntil = { $gte: now };
    }

    if (expired === 'true') {
      query.validUntil = { $lt: now };
    }

    if (req.user.role === 'admin') {
      // Admin sees everything
    } else if (req.user.role === 'restaurant') {
      const restaurant = await Restaurant.findOne({ createdBy: req.user._id });
      const restaurantId = restaurant ? restaurant._id : null;

      query.$or = [
        { scope: 'global' },
        { createdBy: req.user._id },
        ...(restaurantId ? [{ restaurant: restaurantId }] : [])
      ];
    }

    const promoCodes = await PromoCode.find(query)
      .populate('createdBy', 'username email role')
      .populate('restaurant', 'name')
      .populate('applicableRestaurants', 'name')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: promoCodes.length,
      data: promoCodes
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch promo codes',
      error: error.message
    });
  }
};

/**
 * @desc    Get active promo codes (for customers)
 * @route   GET /api/promo/active
 * @access  Private
 */
exports.getActivePromoCodes = async (req, res) => {
  try {
    const now = new Date();
    const { restaurantId } = req.query;

    let query = {
      isActive: true,
      validFrom: { $lte: now },
      validUntil: { $gte: now },
      $or: [
        { usageLimit: null },
        { $expr: { $lt: ['$usedCount', '$usageLimit'] } }
      ]
    };

    if (restaurantId) {
      query.$and = [
        query.$or ? { $or: query.$or } : {},
        {
          $or: [
            { scope: 'global', applicableRestaurants: { $size: 0 } },
            { scope: 'global', applicableRestaurants: restaurantId },
            { restaurant: restaurantId }
          ]
        }
      ];
      delete query.$or;
    }

    const promoCodes = await PromoCode.find(query)
      .select('code description discountType discountValue minOrderAmount maxDiscount validUntil scope restaurant')
      .populate('restaurant', 'name');

    res.status(200).json({
      success: true,
      count: promoCodes.length,
      data: promoCodes
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch promo codes',
      error: error.message
    });
  }
};

/**
 * @desc    Validate a promo code
 * @route   POST /api/promo/validate
 * @access  Private
 */
exports.validatePromoCode = async (req, res) => {
  try {
    const { code, orderAmount, restaurantId } = req.body;

    const promoCode = await PromoCode.findOne({ code: code.toUpperCase() });

    if (!promoCode) {
      return res.status(404).json({
        success: false,
        message: 'Invalid promo code'
      });
    }

    const validation = promoCode.isValid(orderAmount, restaurantId);

    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        message: validation.message
      });
    }

    const discount = promoCode.calculateDiscount(orderAmount);

    res.status(200).json({
      success: true,
      data: {
        code: promoCode.code,
        discountType: promoCode.discountType,
        discountValue: promoCode.discountValue,
        calculatedDiscount: discount,
        description: promoCode.description
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to validate promo code',
      error: error.message
    });
  }
};

/**
 * @desc    Update promo code (RBAC enforced)
 * @route   PUT /api/promo/:id
 * @access  Private (Admin or owning Restaurant Manager)
 */
exports.updatePromoCode = async (req, res) => {
  try {
    const promoCode = await PromoCode.findById(req.params.id);

    if (!promoCode) {
      return res.status(404).json({
        success: false,
        message: 'Promo code not found'
      });
    }

    // RBAC check
    if (!canModifyPromo(promoCode, req.user)) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to modify this offer'
      });
    }

    // Prevent RM from setting global scope
    if (req.user.role === 'restaurant' && req.body.scope === 'global') {
      return res.status(403).json({
        success: false,
        message: 'Restaurant managers cannot create global offers'
      });
    }

    // Track changes for audit log
    const changes = {};
    const allowedFields = [
      'description', 'discountType', 'discountValue', 'minOrderAmount',
      'maxDiscount', 'validFrom', 'validUntil', 'usageLimit', 'perUserLimit',
      'applicableRestaurants', 'applicableCategories', 'isActive', 'scope', 'code'
    ];

    allowedFields.forEach(field => {
      if (req.body[field] !== undefined && JSON.stringify(promoCode[field]) !== JSON.stringify(req.body[field])) {
        changes[field] = { from: promoCode[field], to: req.body[field] };
      }
    });

    Object.keys(req.body).forEach(key => {
      if (allowedFields.includes(key)) {
        promoCode[key] = req.body[key];
      }
    });

    addAuditLog(promoCode, 'updated', req.user, changes);
    await promoCode.save();

    res.status(200).json({
      success: true,
      message: 'Promo code updated successfully',
      data: promoCode
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update promo code',
      error: error.message
    });
  }
};

/**
 * @desc    Delete promo code (RBAC enforced)
 * @route   DELETE /api/promo/:id
 * @access  Private (Admin or owning Restaurant Manager)
 */
exports.deletePromoCode = async (req, res) => {
  try {
    const promoCode = await PromoCode.findById(req.params.id);

    if (!promoCode) {
      return res.status(404).json({
        success: false,
        message: 'Promo code not found'
      });
    }

    if (!canModifyPromo(promoCode, req.user)) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to delete this offer'
      });
    }

    await promoCode.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Promo code deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to delete promo code',
      error: error.message
    });
  }
};

/**
 * @desc    Toggle promo code status (RBAC enforced)
 * @route   PUT /api/promo/:id/toggle
 * @access  Private (Admin or owning Restaurant Manager)
 */
exports.togglePromoCodeStatus = async (req, res) => {
  try {
    const promoCode = await PromoCode.findById(req.params.id);

    if (!promoCode) {
      return res.status(404).json({
        success: false,
        message: 'Promo code not found'
      });
    }

    if (!canModifyPromo(promoCode, req.user)) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to toggle this offer'
      });
    }

    promoCode.isActive = !promoCode.isActive;

    addAuditLog(promoCode, 'toggled', req.user, {
      isActive: { from: !promoCode.isActive, to: promoCode.isActive }
    });

    await promoCode.save();

    res.status(200).json({
      success: true,
      message: `Promo code ${promoCode.isActive ? 'activated' : 'deactivated'}`,
      data: promoCode
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to toggle promo code status',
      error: error.message
    });
  }
};

/**
 * @desc    Broadcast a promo code notification to all customers
 * @route   POST /api/promo/broadcast/:id
 * @access  Private (Admin only)
 */
exports.broadcastPromoNotification = async (req, res) => {
  try {
    const promoCode = await PromoCode.findById(req.params.id);

    if (!promoCode) {
      return res.status(404).json({
        success: false,
        message: 'Promo code not found'
      });
    }

    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only Super Admin can broadcast offers'
      });
    }

    const customers = await User.find({ role: 'customer' });

    if (customers.length === 0) {
      return res.status(200).json({
        success: true,
        message: 'No customers found to notify'
      });
    }

    const notificationTitle = `Special Offer: ${promoCode.code}`;
    const notificationMessage = promoCode.description ||
      `Use code ${promoCode.code} to get ${promoCode.discountValue}${promoCode.discountType === 'percentage' ? '%' : ' Rs.'} off your next order!`;

    const notificationPromises = customers.map(customer => {
      return Notification.create({
        user: customer._id,
        type: 'promotion',
        title: notificationTitle,
        message: notificationMessage,
        data: {
          code: promoCode.code,
          promoId: promoCode._id
        }
      });
    });

    await Promise.all(notificationPromises);

    addAuditLog(promoCode, 'broadcasted', req.user, { customerCount: customers.length });
    await promoCode.save();

    const io = getIO();
    io.emit('notification', {
      type: 'promotion',
      title: notificationTitle,
      message: notificationMessage,
      data: {
        code: promoCode.code,
        promoId: promoCode._id
      }
    });

    res.status(200).json({
      success: true,
      message: `Successfully broadcasted offer to ${customers.length} customers`
    });
  } catch (error) {
    console.error('Broadcast error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to broadcast promo notification',
      error: error.message
    });
  }
};

/**
 * @desc    Get audit log for a promo code
 * @route   GET /api/promo/:id/audit
 * @access  Private (Admin only)
 */
exports.getPromoAuditLog = async (req, res) => {
  try {
    const promoCode = await PromoCode.findById(req.params.id)
      .select('code auditLog')
      .populate('auditLog.performedBy', 'username email role');

    if (!promoCode) {
      return res.status(404).json({
        success: false,
        message: 'Promo code not found'
      });
    }

    res.status(200).json({
      success: true,
      data: {
        code: promoCode.code,
        auditLog: promoCode.auditLog.sort((a, b) => b.timestamp - a.timestamp)
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch audit log',
      error: error.message
    });
  }
};
