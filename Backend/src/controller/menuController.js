const Menu = require('../models/Menu');
const Restaurant = require('../models/Restaurant');

/**
 * @desc    Add a new menu item
 * @route   POST /api/menu
 * @access  Private (Restaurant Manager)
 */
exports.createMenuItem = async (req, res) => {
  try {
    const {
      name,
      description,
      price,
      category,
      image,
      isVegetarian,
      isVegan,
      isGlutenFree,
      spiceLevel,
      allergens,
      preparationTime,
      calories
    } = req.body;

    // Find restaurant for this manager
    const restaurant = await Restaurant.findOne({ createdBy: req.user._id });
    
    if (!restaurant) {
      return res.status(404).json({
        success: false,
        message: 'Restaurant not found for this user'
      });
    }

    const menuItem = await Menu.create({
      name,
      description,
      price,
      category,
      image,
      isVegetarian,
      isVegan,
      isGlutenFree,
      spiceLevel,
      allergens,
      preparationTime,
      calories,
      restaurant: restaurant._id
    });

    res.status(201).json({
      success: true,
      message: 'Menu item created successfully',
      data: menuItem
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to create menu item',
      error: error.message
    });
  }
};

/**
 * @desc    Get all menu items for a restaurant
 * @route   GET /api/menu/restaurant/:restaurantId
 * @access  Public
 */
exports.getMenuByRestaurant = async (req, res) => {
  try {
    const { restaurantId } = req.params;
    const { category, vegetarian, vegan, glutenFree } = req.query;

    let query = { restaurant: restaurantId, isAvailable: true };

    if (category) query.category = category;
    if (vegetarian === 'true') query.isVegetarian = true;
    if (vegan === 'true') query.isVegan = true;
    if (glutenFree === 'true') query.isGlutenFree = true;

    const menuItems = await Menu.find(query).sort({ category: 1, name: 1 });

    // Group by category
    const groupedMenu = menuItems.reduce((acc, item) => {
      if (!acc[item.category]) {
        acc[item.category] = [];
      }
      acc[item.category].push(item);
      return acc;
    }, {});

    res.status(200).json({
      success: true,
      count: menuItems.length,
      data: groupedMenu
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch menu',
      error: error.message
    });
  }
};

/**
 * @desc    Get menu items for current restaurant manager
 * @route   GET /api/menu/my-menu
 * @access  Private (Restaurant Manager)
 */
exports.getMyMenu = async (req, res) => {
  try {
    const restaurant = await Restaurant.findOne({ createdBy: req.user._id });
    
    if (!restaurant) {
      return res.status(404).json({
        success: false,
        message: 'Restaurant not found for this user'
      });
    }

    const menuItems = await Menu.find({ restaurant: restaurant._id }).sort({ category: 1, name: 1 });

    res.status(200).json({
      success: true,
      count: menuItems.length,
      data: menuItems
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch menu',
      error: error.message
    });
  }
};

/**
 * @desc    Get single menu item
 * @route   GET /api/menu/:id
 * @access  Public
 */
exports.getMenuItemById = async (req, res) => {
  try {
    const menuItem = await Menu.findById(req.params.id).populate('restaurant', 'name');

    if (!menuItem) {
      return res.status(404).json({
        success: false,
        message: 'Menu item not found'
      });
    }

    res.status(200).json({
      success: true,
      data: menuItem
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch menu item',
      error: error.message
    });
  }
};

/**
 * @desc    Update menu item
 * @route   PUT /api/menu/:id
 * @access  Private (Restaurant Manager)
 */
exports.updateMenuItem = async (req, res) => {
  try {
    const restaurant = await Restaurant.findOne({ createdBy: req.user._id });
    
    if (!restaurant) {
      return res.status(404).json({
        success: false,
        message: 'Restaurant not found for this user'
      });
    }

    const menuItem = await Menu.findOne({ 
      _id: req.params.id, 
      restaurant: restaurant._id 
    });

    if (!menuItem) {
      return res.status(404).json({
        success: false,
        message: 'Menu item not found or not authorized'
      });
    }

    const updatedItem = await Menu.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      message: 'Menu item updated successfully',
      data: updatedItem
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update menu item',
      error: error.message
    });
  }
};

/**
 * @desc    Delete menu item
 * @route   DELETE /api/menu/:id
 * @access  Private (Restaurant Manager)
 */
exports.deleteMenuItem = async (req, res) => {
  try {
    const restaurant = await Restaurant.findOne({ createdBy: req.user._id });
    
    if (!restaurant) {
      return res.status(404).json({
        success: false,
        message: 'Restaurant not found for this user'
      });
    }

    const menuItem = await Menu.findOne({ 
      _id: req.params.id, 
      restaurant: restaurant._id 
    });

    if (!menuItem) {
      return res.status(404).json({
        success: false,
        message: 'Menu item not found or not authorized'
      });
    }

    await menuItem.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Menu item deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to delete menu item',
      error: error.message
    });
  }
};

/**
 * @desc    Toggle menu item availability
 * @route   PUT /api/menu/:id/toggle-availability
 * @access  Private (Restaurant Manager)
 */
exports.toggleAvailability = async (req, res) => {
  try {
    const restaurant = await Restaurant.findOne({ createdBy: req.user._id });
    
    if (!restaurant) {
      return res.status(404).json({
        success: false,
        message: 'Restaurant not found for this user'
      });
    }

    const menuItem = await Menu.findOne({ 
      _id: req.params.id, 
      restaurant: restaurant._id 
    });

    if (!menuItem) {
      return res.status(404).json({
        success: false,
        message: 'Menu item not found or not authorized'
      });
    }

    menuItem.isAvailable = !menuItem.isAvailable;
    await menuItem.save();

    res.status(200).json({
      success: true,
      message: `Menu item ${menuItem.isAvailable ? 'enabled' : 'disabled'} successfully`,
      data: menuItem
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to toggle availability',
      error: error.message
    });
  }
};

/**
 * @desc    Search menu items
 * @route   GET /api/menu/search
 * @access  Public
 */
exports.searchMenuItems = async (req, res) => {
  try {
    const { q, category, minPrice, maxPrice, vegetarian, vegan } = req.query;

    let query = { isAvailable: true };

    if (q) {
      query.$text = { $search: q };
    }

    if (category) query.category = category;
    if (minPrice) query.price = { ...query.price, $gte: Number(minPrice) };
    if (maxPrice) query.price = { ...query.price, $lte: Number(maxPrice) };
    if (vegetarian === 'true') query.isVegetarian = true;
    if (vegan === 'true') query.isVegan = true;

    const menuItems = await Menu.find(query)
      .populate('restaurant', 'name logoUrl')
      .limit(50);

    res.status(200).json({
      success: true,
      count: menuItems.length,
      data: menuItems
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to search menu items',
      error: error.message
    });
  }
};
