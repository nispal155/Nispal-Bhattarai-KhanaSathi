const User = require('../models/User');
const Address = require('../models/Address');
const Order = require('../models/Order');
const {
  normalizeChildControls,
  getChildControls,
  getChildSpendingSnapshot
} = require('../utils/childAccountControls');
const {
  buildChildOrderHistorySummary,
  buildChildNutritionInsights
} = require('../utils/childInsights');

const PARENT_ALLOWED_ROLES = new Set(['customer']);
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const canManageChildren = (role) => PARENT_ALLOWED_ROLES.has(role);
const ensureAdminAccess = (req, res) => {
  if (req.user?.role !== 'admin') {
    res.status(403).json({
      success: false,
      message: 'Admin access required'
    });
    return false;
  }
  return true;
};

const serializeChildAccount = (child) => ({
  _id: child._id,
  username: child.username,
  email: child.email,
  role: child.role,
  parentAccount: child.parentAccount,
  displayName: child.childProfile?.displayName || child.username,
  isActive: child.childProfile?.isActive !== false,
  isProfileComplete: child.isProfileComplete,
  isApproved: child.isApproved,
  onboardingSubmittedAt: child.childProfile?.onboardingSubmittedAt,
  spendingLimits: getChildControls(child).spendingLimits,
  foodRestrictions: getChildControls(child).foodRestrictions,
  createdAt: child.createdAt,
  updatedAt: child.updatedAt
});

const serializeChildOrderPreview = (order) => ({
  _id: order._id,
  orderNumber: order.orderNumber,
  status: order.status,
  paymentStatus: order.paymentStatus,
  total: Number(Number(order?.pricing?.total || 0).toFixed(2)),
  createdAt: order.createdAt,
  restaurant: order.restaurant
    ? {
      _id: order.restaurant._id,
      name: order.restaurant.name,
      logoUrl: order.restaurant.logoUrl || ''
    }
    : null,
  items: (order.items || []).map((item) => ({
    name: item.name,
    quantity: item.quantity,
    price: item.price,
    calories: item.menuItem?.calories ?? null,
    category: item.menuItem?.category || null
  }))
});

const buildChildUsernameFromEmail = async (email) => {
  const emailPrefix = String(email || '').split('@')[0] || 'child';
  const slug = emailPrefix
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/(^_+|_+$)/g, '') || 'child';

  for (let attempt = 0; attempt < 10; attempt += 1) {
    const candidate = attempt === 0 ? `child_${slug}` : `child_${slug}_${Math.floor(Math.random() * 1e6)}`;
    const exists = await User.findOne({ username: candidate }).select('_id');
    if (!exists) return candidate;
  }

  throw new Error('Unable to generate a unique child username');
};

/**
 * @desc    Get current user profile
 * @route   GET /api/users/profile
 * @access  Private
 */
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .select('-password')
      .populate('parentAccount', 'username email phone');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('Get profile ERROR:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch profile',
      error: error.message
    });
  }
};

/**
 * @desc    Update user profile
 * @route   PUT /api/users/profile
 * @access  Private
 */
exports.updateProfile = async (req, res) => {
  try {
    const { username, phone, dateOfBirth, profilePicture, notifications } = req.body;
    console.log('Update profile request received:', {
      username,
      phone,
      dateOfBirth,
      hasProfilePicture: !!profilePicture,
      pictureSize: profilePicture ? profilePicture.length : 0,
      notifications
    });

    console.log('Current authenticated user ID:', req.user?._id);

    const updateData = {};
    if (username) updateData.username = username;
    if (profilePicture) updateData.profilePicture = profilePicture;

    // Only allow customers to update phone and date of birth
    if (req.user.role !== 'restaurant') {
      if (phone) updateData.phone = phone;
      if (dateOfBirth) updateData.dateOfBirth = dateOfBirth;
    }

    // Allow all roles to update notification preferences
    if (notifications) {
      updateData.notifications = {
        push: notifications.push ?? true,
        email: notifications.email ?? true,
        sms: notifications.sms ?? false
      };
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $set: updateData },
      { new: true, runValidators: true }
    )
      .select('-password')
      .populate('parentAccount', 'username email phone');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: user
    });
  } catch (error) {
    console.error('Update profile ERROR:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update profile',
      error: error.message
    });
  }
};

/**
 * @desc    Get user addresses
 * @route   GET /api/users/addresses
 * @access  Private
 */
exports.getAddresses = async (req, res) => {
  try {
    const addresses = await Address.find({ user: req.user._id }).sort({ isDefault: -1 });

    res.status(200).json({
      success: true,
      count: addresses.length,
      data: addresses
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch addresses',
      error: error.message
    });
  }
};

/**
 * @desc    Add new address
 * @route   POST /api/users/addresses
 * @access  Private
 */
exports.addAddress = async (req, res) => {
  try {
    const {
      label,
      customLabel,
      addressLine1,
      addressLine2,
      city,
      state,
      zipCode,
      landmark,
      coordinates,
      contactPhone,
      isDefault
    } = req.body;

    const address = await Address.create({
      user: req.user._id,
      label,
      customLabel,
      addressLine1,
      addressLine2,
      city,
      state,
      zipCode,
      landmark,
      coordinates,
      contactPhone,
      isDefault
    });

    res.status(201).json({
      success: true,
      message: 'Address added successfully',
      data: address
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to add address',
      error: error.message
    });
  }
};

/**
 * @desc    Update address
 * @route   PUT /api/users/addresses/:id
 * @access  Private
 */
exports.updateAddress = async (req, res) => {
  try {
    const address = await Address.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!address) {
      return res.status(404).json({
        success: false,
        message: 'Address not found'
      });
    }

    const updatedAddress = await Address.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      message: 'Address updated successfully',
      data: updatedAddress
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update address',
      error: error.message
    });
  }
};

/**
 * @desc    Delete address
 * @route   DELETE /api/users/addresses/:id
 * @access  Private
 */
exports.deleteAddress = async (req, res) => {
  try {
    const address = await Address.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!address) {
      return res.status(404).json({
        success: false,
        message: 'Address not found'
      });
    }

    await address.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Address deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to delete address',
      error: error.message
    });
  }
};

/**
 * @desc    Set default address
 * @route   PUT /api/users/addresses/:id/set-default
 * @access  Private
 */
exports.setDefaultAddress = async (req, res) => {
  try {
    // Remove default from all addresses
    await Address.updateMany(
      { user: req.user._id },
      { isDefault: false }
    );

    // Set new default
    const address = await Address.findByIdAndUpdate(
      req.params.id,
      { isDefault: true },
      { new: true }
    );

    if (!address) {
      return res.status(404).json({
        success: false,
        message: 'Address not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Default address updated',
      data: address
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to set default address',
      error: error.message
    });
  }
};

/**
 * @desc    Create child account linked to parent
 * @route   POST /api/users/children
 * @access  Private (Customer as parent)
 */
exports.createChildAccount = async (req, res) => {
  try {
    if (!canManageChildren(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Only customer parent accounts can create child accounts'
      });
    }

    const { email, password, displayName, spendingLimits, foodRestrictions } = req.body;
    const normalizedEmail = String(email || '').trim().toLowerCase();
    const normalizedControls = normalizeChildControls({ spendingLimits, foodRestrictions });

    if (!normalizedEmail || !password) {
      return res.status(400).json({
        success: false,
        message: 'Child email and password are required'
      });
    }

    if (!EMAIL_REGEX.test(normalizedEmail)) {
      return res.status(400).json({
        success: false,
        message: 'Please enter a valid child email address'
      });
    }

    if (String(password).length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long'
      });
    }

    const emailExists = await User.findOne({ email: normalizedEmail }).select('_id');
    if (emailExists) {
      return res.status(400).json({
        success: false,
        message: 'A user with this email already exists'
      });
    }

    const generatedUsername = await buildChildUsernameFromEmail(normalizedEmail);
    const child = await User.create({
      username: generatedUsername,
      email: normalizedEmail,
      password,
      role: 'child',
      parentAccount: req.user._id,
      isVerified: true,
      isProfileComplete: false,
      isApproved: false,
      childProfile: {
        displayName: displayName?.trim() || generatedUsername,
        isActive: true,
        spendingLimits: normalizedControls.spendingLimits,
        foodRestrictions: normalizedControls.foodRestrictions
      }
    });

    res.status(201).json({
      success: true,
      message: 'Child account created successfully',
      data: serializeChildAccount(child)
    });
  } catch (error) {
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.statusCode ? error.message : 'Failed to create child account',
      error: error.message,
      details: error.details
    });
  }
};

/**
 * @desc    Get all child accounts linked to current parent
 * @route   GET /api/users/children
 * @access  Private (Customer as parent)
 */
exports.getMyChildAccounts = async (req, res) => {
  try {
    if (!canManageChildren(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Only customer parent accounts can view child accounts'
      });
    }

    const children = await User.find({
      role: 'child',
      parentAccount: req.user._id
    })
      .select('username email role parentAccount childProfile isProfileComplete isApproved createdAt updatedAt')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: children.length,
      data: children.map(serializeChildAccount)
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch child accounts',
      error: error.message
    });
  }
};

/**
 * @desc    Get parent-facing order history and nutrition insights for a child account
 * @route   GET /api/users/children/:childId/insights
 * @access  Private (Customer as parent)
 */
exports.getChildAccountInsights = async (req, res) => {
  try {
    if (!canManageChildren(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Only customer parent accounts can view child insights'
      });
    }

    const child = await User.findOne({
      _id: req.params.childId,
      role: 'child',
      parentAccount: req.user._id
    })
      .select('username email role parentAccount childProfile isProfileComplete isApproved createdAt updatedAt');

    if (!child) {
      return res.status(404).json({
        success: false,
        message: 'Child account not found'
      });
    }

    const [spending, orders] = await Promise.all([
      getChildSpendingSnapshot(child),
      Order.find({ customer: child._id })
        .populate('restaurant', 'name logoUrl')
        .populate('items.menuItem', 'calories category isJunkFood containsCaffeine allergens isVegetarian isVegan isGlutenFree')
        .sort({ createdAt: -1 })
    ]);

    const orderHistory = buildChildOrderHistorySummary(orders);
    const nutritionInsights = buildChildNutritionInsights(
      orders.filter((order) => order.status !== 'cancelled')
    );

    return res.status(200).json({
      success: true,
      data: {
        child: serializeChildAccount(child),
        spending,
        orderHistory: {
          ...orderHistory,
          recentOrders: orders.slice(0, 6).map(serializeChildOrderPreview)
        },
        nutritionInsights
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch child insights',
      error: error.message
    });
  }
};

/**
 * @desc    Get the authenticated child account spending summary
 * @route   GET /api/users/child-summary
 * @access  Private (Child)
 */
exports.getChildSummary = async (req, res) => {
  try {
    if (req.user.role !== 'child') {
      return res.status(403).json({
        success: false,
        message: 'Only child accounts can view this summary'
      });
    }

    const child = await User.findById(req.user._id)
      .select('username email role parentAccount childProfile isProfileComplete isApproved createdAt updatedAt');

    if (!child || child.role !== 'child') {
      return res.status(404).json({
        success: false,
        message: 'Child account not found'
      });
    }

    const [spending, orders, activeOrders] = await Promise.all([
      getChildSpendingSnapshot(child),
      Order.find({
        customer: child._id,
        isHiddenForCustomer: { $ne: true }
      })
        .populate('restaurant', 'name logoUrl')
        .populate('items.menuItem', 'calories category')
        .sort({ createdAt: -1 })
        .limit(3),
      Order.countDocuments({
        customer: child._id,
        isHiddenForCustomer: { $ne: true },
        status: { $nin: ['delivered', 'cancelled'] }
      })
    ]);

    return res.status(200).json({
      success: true,
      data: {
        spending,
        activeOrders,
        recentOrders: orders.map(serializeChildOrderPreview)
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch child summary',
      error: error.message
    });
  }
};

/**
 * @desc    Update linked child account
 * @route   PUT /api/users/children/:childId
 * @access  Private (Customer as parent)
 */
exports.updateChildAccount = async (req, res) => {
  try {
    if (!canManageChildren(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Only customer parent accounts can update child accounts'
      });
    }

    const { childId } = req.params;
    const { email, password, displayName, isActive, spendingLimits, foodRestrictions } = req.body;

    const child = await User.findOne({
      _id: childId,
      role: 'child',
      parentAccount: req.user._id
    });

    if (!child) {
      return res.status(404).json({
        success: false,
        message: 'Child account not found'
      });
    }

    if (email && String(email).trim().toLowerCase() !== String(child.email).toLowerCase()) {
      const normalizedEmail = String(email).trim().toLowerCase();
      if (!EMAIL_REGEX.test(normalizedEmail)) {
        return res.status(400).json({
          success: false,
          message: 'Please enter a valid child email address'
        });
      }

      const emailExists = await User.findOne({ email: normalizedEmail }).select('_id');
      if (emailExists) {
        return res.status(400).json({
          success: false,
          message: 'A user with this email already exists'
        });
      }

      child.email = normalizedEmail;
    }

    if (!child.childProfile) {
      child.childProfile = {};
    }

    if (spendingLimits !== undefined || foodRestrictions !== undefined) {
      const normalizedControls = normalizeChildControls({
        spendingLimits: spendingLimits !== undefined
          ? spendingLimits
          : child.childProfile?.spendingLimits || {},
        foodRestrictions: foodRestrictions !== undefined
          ? foodRestrictions
          : child.childProfile?.foodRestrictions || {}
      });

      child.childProfile.spendingLimits = normalizedControls.spendingLimits;
      child.childProfile.foodRestrictions = normalizedControls.foodRestrictions;
    }

    if (typeof displayName === 'string') {
      child.childProfile.displayName = displayName.trim() || child.username;
    }

    if (typeof isActive === 'boolean') {
      child.childProfile.isActive = isActive;
    }

    if (password) {
      if (String(password).length < 6) {
        return res.status(400).json({
          success: false,
          message: 'Password must be at least 6 characters long'
        });
      }
      child.password = password;
    }

    await child.save();

    res.status(200).json({
      success: true,
      message: 'Child account updated successfully',
      data: serializeChildAccount(child)
    });
  } catch (error) {
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.statusCode ? error.message : 'Failed to update child account',
      error: error.message,
      details: error.details
    });
  }
};

/**
 * @desc    Delete linked child account
 * @route   DELETE /api/users/children/:childId
 * @access  Private (Customer as parent)
 */
exports.deleteChildAccount = async (req, res) => {
  try {
    if (!canManageChildren(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Only customer parent accounts can delete child accounts'
      });
    }

    const child = await User.findOne({
      _id: req.params.childId,
      role: 'child',
      parentAccount: req.user._id
    });

    if (!child) {
      return res.status(404).json({
        success: false,
        message: 'Child account not found'
      });
    }

    await child.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Child account deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to delete child account',
      error: error.message
    });
  }
};

/**
 * @desc    Submit child onboarding details and documents
 * @route   POST /api/users/child-onboarding
 * @access  Private (Child)
 */
exports.submitChildOnboarding = async (req, res) => {
  try {
    if (req.user.role !== 'child') {
      return res.status(403).json({
        success: false,
        message: 'Only child accounts can submit child onboarding'
      });
    }

    const { birthCertificate, childPhoto, dateOfBirth, displayName } = req.body;
    const normalizedBirthCertificate = String(birthCertificate || '').trim();

    if (!normalizedBirthCertificate || !childPhoto) {
      return res.status(400).json({
        success: false,
        message: 'Birth certificate and child photo are required'
      });
    }

    if (!normalizedBirthCertificate.toLowerCase().startsWith('data:application/pdf')) {
      return res.status(400).json({
        success: false,
        message: 'Birth certificate must be uploaded as a PDF file'
      });
    }

    const child = await User.findById(req.user._id);
    if (!child || child.role !== 'child') {
      return res.status(404).json({
        success: false,
        message: 'Child account not found'
      });
    }

    if (!child.childProfile) {
      child.childProfile = {};
    }

    if (typeof displayName === 'string' && displayName.trim()) {
      child.childProfile.displayName = displayName.trim();
    }

    child.childProfile.birthCertificate = normalizedBirthCertificate;
    child.childProfile.childPhoto = childPhoto;
    child.childProfile.onboardingSubmittedAt = new Date();
    child.profilePicture = childPhoto;

    if (dateOfBirth) {
      child.dateOfBirth = dateOfBirth;
    }

    child.isProfileComplete = true;
    child.isApproved = false;

    await child.save();

    res.status(200).json({
      success: true,
      message: 'Onboarding submitted successfully. Waiting for admin approval.',
      data: {
        isProfileComplete: child.isProfileComplete,
        isApproved: child.isApproved,
        onboardingSubmittedAt: child.childProfile?.onboardingSubmittedAt
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to submit child onboarding',
      error: error.message
    });
  }
};

/**
 * @desc    Get all users (Admin)
 * @route   GET /api/users
 * @access  Private (Admin)
 */
exports.getAllUsers = async (req, res) => {
  try {
    if (!ensureAdminAccess(req, res)) return;

    const { role, excludeRole, search, limit = 20, page = 1 } = req.query;

    let query = {};

    if (role) {
      query.role = role;
    } else if (excludeRole) {
      query.role = { $ne: excludeRole };
    }

    if (search) {
      query.$or = [
        { username: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    let usersQuery = User.find(query)
      .select('-password -otp -otpExpires')
      .sort({ createdAt: -1 })
      .limit(Number(limit))
      .skip((Number(page) - 1) * Number(limit));

    if (role === 'child') {
      usersQuery = usersQuery.populate('parentAccount', 'username email');
    }

    const users = await usersQuery;

    const total = await User.countDocuments(query);

    res.status(200).json({
      success: true,
      count: users.length,
      total,
      pages: Math.ceil(total / limit),
      data: users
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch users',
      error: error.message
    });
  }
};

/**
 * @desc    Get user by ID (Admin)
 * @route   GET /api/users/:id
 * @access  Private (Admin)
 */
exports.getUserById = async (req, res) => {
  try {
    if (!ensureAdminAccess(req, res)) return;

    const user = await User.findById(req.params.id).select('-password -otp -otpExpires');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user',
      error: error.message
    });
  }
};

/**
 * @desc    Update user (Admin)
 * @route   PUT /api/users/:id
 * @access  Private (Admin)
 */
exports.updateUser = async (req, res) => {
  try {
    if (!ensureAdminAccess(req, res)) return;

    const { role, isVerified, isApproved } = req.body;

    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (role) user.role = role;
    if (typeof isVerified === 'boolean') user.isVerified = isVerified;
    if (typeof isApproved === 'boolean') user.isApproved = isApproved;

    await user.save();

    res.status(200).json({
      success: true,
      message: 'User updated successfully',
      data: user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update user',
      error: error.message
    });
  }
};

/**
 * @desc    Delete user (Admin)
 * @route   DELETE /api/users/:id
 * @access  Private (Admin)
 */
exports.deleteUser = async (req, res) => {
  try {
    if (!ensureAdminAccess(req, res)) return;

    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Delete user's addresses too
    await Address.deleteMany({ user: req.params.id });
    await user.deleteOne();

    res.status(200).json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to delete user',
      error: error.message
    });
  }
};

/**
 * @desc    Get user statistics (Admin)
 * @route   GET /api/users/stats
 * @access  Private (Admin)
 */
exports.getUserStats = async (req, res) => {
  try {
    if (!ensureAdminAccess(req, res)) return;

    const [
      totalUsers,
      customers,
      restaurants,
      deliveryStaff,
      verifiedUsers,
      approvedManagers
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ role: 'customer' }),
      User.countDocuments({ role: 'restaurant' }),
      User.countDocuments({ role: 'delivery_staff' }),
      User.countDocuments({ isVerified: true }),
      User.countDocuments({ role: { $in: ['restaurant', 'delivery_staff'] }, isApproved: true })
    ]);

    res.status(200).json({
      success: true,
      data: {
        totalUsers,
        customers,
        restaurants,
        deliveryStaff,
        verifiedUsers,
        approvedManagers
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user statistics',
      error: error.message
    });
  }
};
