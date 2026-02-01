const Restaurant = require("../models/Restaurant");
const User = require("../models/User");
const { sendWelcomeEmail } = require("../services/emailService");

/**
 * @desc    Create a new restaurant (Admin sets name and manager credentials)
 * @route   POST /api/restaurants
 * @access  Private (Admin)
 */
exports.createRestaurant = async (req, res) => {
  try {
    const {
      name,
      username,
      email,
      password
    } = req.body;

    if (!name || !username || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Please provide restaurant name and manager credentials"
      });
    }

    // Check if user exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({
        success: false,
        message: "User with this email already exists"
      });
    }

    // Create Manager User
    // Note: We set isVerified to true for admin-created accounts (or send OTP if required)
    // For consistency with staffController, we could use the OTP flow, 
    // but usually admin-added managers might be pre-verified. 
    // Let's stick to the user's staff flow for consistency.
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000);

    const user = await User.create({
      username,
      email,
      password,
      role: 'restaurant',
      isVerified: false,
      otp,
      otpExpires
    });

    // Create Restaurant Skeleton
    const restaurant = await Restaurant.create({
      name,
      createdBy: user._id,
      isActive: true // Active but manager still needs to onboard
    });

    // Send Welcome Email
    try {
      await sendWelcomeEmail(email, username, password, 'Restaurant Manager', otp);
    } catch (emailError) {
      console.error("Failed to send welcome email to restaurant manager:", emailError);
      // We don't fail the whole request if email fails, but it's good to log
    }

    res.status(201).json({
      success: true,
      message: "Restaurant and manager account created. Manager must now verify and onboard.",
      data: {
        restaurant,
        user: {
          _id: user._id,
          username: user.username,
          email: user.email
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to create restaurant",
      error: error.message
    });
  }
};

/**
 * @desc    Get all restaurants
 * @route   GET /api/restaurants
 * @access  Public
 */
exports.getAllRestaurants = async (req, res) => {
  try {
    const restaurants = await Restaurant.find({ isActive: true })
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: restaurants.length,
      data: restaurants
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch restaurants",
      error: error.message
    });
  }
};

/**
 * @desc    Get single restaurant
 * @route   GET /api/restaurants/:id
 * @access  Public
 */
exports.getRestaurantById = async (req, res) => {
  try {
    const restaurant = await Restaurant.findById(req.params.id);

    if (!restaurant) {
      return res.status(404).json({
        success: false,
        message: "Restaurant not found"
      });
    }

    res.status(200).json({
      success: true,
      data: restaurant
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch restaurant",
      error: error.message
    });
  }
};

/**
 * @desc    Update restaurant
 * @route   PUT /api/restaurants/:id
 * @access  Private (Admin)
 */
exports.updateRestaurant = async (req, res) => {
  try {
    const restaurant = await Restaurant.findById(req.params.id);

    if (!restaurant) {
      return res.status(404).json({
        success: false,
        message: "Restaurant not found"
      });
    }

    const {
      name,
      addressLine1,
      addressLine2,
      city,
      state,
      zipCode,
      cuisineType,
      openingHour,
      closingHour,
      contactPhone,
      contactEmail,
      logoUrl,
      isActive,
      deliveryTimeMin,
      deliveryTimeMax,
      priceRange,
      tags
    } = req.body;

    // Update basic fields if provided
    if (name !== undefined) restaurant.name = name;
    if (openingHour !== undefined) restaurant.openingHour = openingHour;
    if (closingHour !== undefined) restaurant.closingHour = closingHour;
    if (contactPhone !== undefined) restaurant.contactPhone = contactPhone;
    if (contactEmail !== undefined) restaurant.contactEmail = contactEmail;
    if (logoUrl !== undefined) restaurant.logoUrl = logoUrl;
    if (isActive !== undefined) restaurant.isActive = isActive;
    if (priceRange !== undefined) restaurant.priceRange = priceRange;

    // Handle nested address
    if (addressLine1 !== undefined || addressLine2 !== undefined || city !== undefined || state !== undefined || zipCode !== undefined) {
      if (!restaurant.address) restaurant.address = {};
      if (addressLine1 !== undefined) restaurant.address.addressLine1 = addressLine1;
      if (addressLine2 !== undefined) restaurant.address.addressLine2 = addressLine2;
      if (city !== undefined) restaurant.address.city = city;
      if (state !== undefined) restaurant.address.state = state;
      if (zipCode !== undefined) restaurant.address.zipCode = zipCode;
    }

    // Handle nested deliveryTime
    if (deliveryTimeMin !== undefined || deliveryTimeMax !== undefined) {
      if (!restaurant.deliveryTime) restaurant.deliveryTime = { min: 30, max: 45 };
      if (deliveryTimeMin !== undefined) restaurant.deliveryTime.min = Number(deliveryTimeMin);
      if (deliveryTimeMax !== undefined) restaurant.deliveryTime.max = Number(deliveryTimeMax);
    }

    // Handle cuisineType (string or array)
    if (cuisineType !== undefined) {
      if (Array.isArray(cuisineType)) {
        restaurant.cuisineType = cuisineType;
      } else if (typeof cuisineType === "string") {
        restaurant.cuisineType = cuisineType.split(",").map(c => c.trim());
      }
    }

    // Handle tags
    if (tags !== undefined) {
      if (Array.isArray(tags)) {
        restaurant.tags = tags;
      } else if (typeof tags === "string") {
        restaurant.tags = tags.split(",").map(t => t.trim());
      }
    }

    await restaurant.save();

    res.status(200).json({
      success: true,
      message: "Restaurant updated successfully",
      data: restaurant
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to update restaurant",
      error: error.message
    });
  }
};

/**
 * @desc    Delete restaurant (soft delete)
 * @route   DELETE /api/restaurants/:id
 * @access  Private (Admin)
 */
exports.deleteRestaurant = async (req, res) => {
  try {
    const restaurant = await Restaurant.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );

    if (!restaurant) {
      return res.status(404).json({
        success: false,
        message: "Restaurant not found"
      });
    }

    res.status(200).json({
      success: true,
      message: "Restaurant deleted successfully"
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to delete restaurant",
      error: error.message
    });
  }
};

/**
 * @desc    Onboard a restaurant (first-time details and documents)
 * @route   PUT /api/restaurants/onboard
 * @access  Private (Restaurant Manager)
 */
exports.onboardRestaurant = async (req, res) => {
  try {
    const {
      name,
      address,
      cuisineType,
      openingHour,
      closingHour,
      contactPhone,
      contactEmail,
      logoUrl,
      documents
    } = req.body;

    const userId = req.user._id;

    // Create or update restaurant record
    let restaurant = await Restaurant.findOne({ createdBy: userId });

    const cuisineArray = Array.isArray(cuisineType)
      ? cuisineType
      : cuisineType.split(",").map(c => c.trim());

    if (restaurant) {
      restaurant.name = name;
      restaurant.address = address;
      restaurant.cuisineType = cuisineArray;
      restaurant.openingHour = openingHour;
      restaurant.closingHour = closingHour;
      restaurant.contactPhone = contactPhone;
      restaurant.contactEmail = contactEmail;
      restaurant.logoUrl = logoUrl;
    } else {
      restaurant = new Restaurant({
        name,
        address,
        cuisineType: cuisineArray,
        openingHour,
        closingHour,
        contactPhone,
        contactEmail,
        logoUrl,
        createdBy: userId
      });
    }

    await restaurant.save();

    // Update user's documents and mark profile as complete
    const user = await User.findById(userId);
    user.restaurantDocuments = documents;
    user.isProfileComplete = true;
    await user.save();

    res.status(200).json({
      success: true,
      message: "Onboarding details submitted. Waiting for admin approval.",
      data: restaurant
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed during onboarding",
      error: error.message
    });
  }
};

/**
 * @desc    Approve a restaurant manager
 * @route   PUT /api/restaurants/approve/:userId
 * @access  Private (Admin)
 */
exports.approveRestaurant = async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    user.isApproved = true;
    await user.save();

    res.status(200).json({
      success: true,
      message: "Restaurant manager approved successfully"
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to approve restaurant manager",
      error: error.message
    });
  }
};

/**
 * @desc    Get onboarding details for a restaurant manager
 * @route   GET /api/restaurants/onboarding-details/:userId
 * @access  Private (Admin)
 */
exports.getOnboardingDetails = async (req, res) => {
  try {
    const user = await User.findById(req.params.userId).select('restaurantDocuments username email isApproved');
    const restaurant = await Restaurant.findOne({ createdBy: req.params.userId });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    res.status(200).json({
      success: true,
      data: {
        user,
        restaurant
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch onboarding details",
      error: error.message
    });
  }
};
