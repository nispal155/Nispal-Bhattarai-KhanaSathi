const PromoCode = require('../models/PromoCode');

/**
 * @desc    Create a new promo code
 * @route   POST /api/promo
 * @access  Private (Admin)
 */
exports.createPromoCode = async (req, res) => {
  try {
    const {
      code,
      description,
      discountType,
      discountValue,
      minOrderAmount,
      maxDiscount,
      validFrom,
      validUntil,
      usageLimit,
      perUserLimit,
      applicableRestaurants,
      applicableCategories
    } = req.body;

    // Check if code already exists
    const existingCode = await PromoCode.findOne({ code: code.toUpperCase() });
    if (existingCode) {
      return res.status(400).json({
        success: false,
        message: 'Promo code already exists'
      });
    }

    const promoCode = await PromoCode.create({
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
      applicableRestaurants,
      applicableCategories,
      createdBy: req.user._id
    });

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
 * @desc    Get all promo codes
 * @route   GET /api/promo
 * @access  Private (Admin)
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

    const promoCodes = await PromoCode.find(query).sort({ createdAt: -1 });

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

    const promoCodes = await PromoCode.find({
      isActive: true,
      validFrom: { $lte: now },
      validUntil: { $gte: now },
      $or: [
        { usageLimit: null },
        { $expr: { $lt: ['$usedCount', '$usageLimit'] } }
      ]
    }).select('code description discountType discountValue minOrderAmount maxDiscount validUntil');

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
 * @desc    Update promo code
 * @route   PUT /api/promo/:id
 * @access  Private (Admin)
 */
exports.updatePromoCode = async (req, res) => {
  try {
    const promoCode = await PromoCode.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!promoCode) {
      return res.status(404).json({
        success: false,
        message: 'Promo code not found'
      });
    }

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
 * @desc    Delete promo code
 * @route   DELETE /api/promo/:id
 * @access  Private (Admin)
 */
exports.deletePromoCode = async (req, res) => {
  try {
    const promoCode = await PromoCode.findByIdAndDelete(req.params.id);

    if (!promoCode) {
      return res.status(404).json({
        success: false,
        message: 'Promo code not found'
      });
    }

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
 * @desc    Toggle promo code status
 * @route   PUT /api/promo/:id/toggle
 * @access  Private (Admin)
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

    promoCode.isActive = !promoCode.isActive;
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
