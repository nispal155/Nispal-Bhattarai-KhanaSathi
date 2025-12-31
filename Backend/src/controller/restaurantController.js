const Restaurant = require("../models/Restaurant");

/**
 * @desc    Create a new restaurant
 * @route   POST /api/restaurants
 * @access  Private (Admin)
 */
exports.createRestaurant = async (req, res) => {
  try {
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
      logoUrl
    } = req.body;

    // Convert comma-separated cuisines to array
    const cuisineArray = cuisineType
      .split(",")
      .map(c => c.trim());

    const restaurant = await Restaurant.create({
      name,
      address: {
        addressLine1,
        addressLine2,
        city,
        state,
        zipCode
      },
      cuisineType: cuisineArray,
      openingHour,
      closingHour,
      contactPhone,
      contactEmail,
      logoUrl,
      createdBy: req.user._id // from auth middleware
    });

    res.status(201).json({
      success: true,
      message: "Restaurant created successfully",
      data: restaurant
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
    const updates = req.body;

    // Convert cuisineType if updated
    if (updates.cuisineType) {
      updates.cuisineType = updates.cuisineType
        .split(",")
        .map(c => c.trim());
    }

    const restaurant = await Restaurant.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    );

    if (!restaurant) {
      return res.status(404).json({
        success: false,
        message: "Restaurant not found"
      });
    }

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
