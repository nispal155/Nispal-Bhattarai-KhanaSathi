const User = require('../models/User');
const bcrypt = require('bcryptjs');
const { sendWelcomeEmail } = require('../services/emailService');

// @desc    Add a new staff member (delivery staff)
// @route   POST /api/staff/add
// @access  Admin
const addStaff = async (req, res) => {
    try {
        console.log("addStaff Request Body:", req.body);
        const { username, email, password, phone } = req.body;

        // Validation
        if (!username || !email || !password) {
            return res.status(400).json({ message: 'Please provide all required fields' });
        }

        const userExists = await User.findOne({ email });
        const usernameExists = await User.findOne({ username });

        if (userExists) {
            return res.status(400).json({ message: 'User with this email already exists' });
        }

        if (usernameExists) {
            return res.status(400).json({ message: 'Username already taken' });
        }

        // Generate OTP for initial verification
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

        const user = await User.create({
            username,
            email,
            password,
            role: 'delivery_staff',
            isOnline: req.body.status === 'online', // Set status if provided
            isVerified: false, // Force them to verify
            otp,
            otpExpires
        });

        if (user) {
            console.log("Staff User Created:", user._id);

            try {
                const emailResult = await sendWelcomeEmail(email, username, password, 'Delivery Staff', otp);
                if (emailResult.success) {
                    console.log("Welcome Email Sent Successfully:", emailResult.messageId);
                } else {
                    console.error("Welcome Email Sending Failed:", emailResult.error);
                }
            } catch (emailError) {
                console.error("Critical Error during Welcome Email process:", emailError);
            }

            res.status(201).json({
                _id: user._id,
                username: user.username,
                email: user.email,
                role: user.role,
                message: "Staff added successfully"
            });
        } else {
            console.error("User creation operation failed (DB returned null?)");
            res.status(400).json({ message: 'Invalid user data' });
        }
    } catch (error) {
        console.error("addStaff Error:", error);
        res.status(500).json({ message: error.message || "Server Error" });
    }
};

// @desc    Complete delivery staff profile (Onboarding)
// @route   PUT /api/staff/complete-profile
// @access  Private (Delivery Staff)
const completeProfile = async (req, res) => {
    try {
        const { vehicleType, vehicleModel, licensePlate, driversLicense, vehicleInsurance, userId } = req.body;

        // Note: In a real app, userId should come from req.user set by auth middleware
        // But for flexibility in this flow we might check req.body or req.user
        // Assuming we are calling this after login/verification where we have token

        let idToUpdate = userId;
        // checking if req.user exists (via auth middleware)
        if (req.user) {
            idToUpdate = req.user._id;
        }

        if (!idToUpdate) {
            return res.status(401).json({ message: 'User not authenticated' });
        }

        const user = await User.findById(idToUpdate);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Update details
        user.vehicleDetails = {
            type: vehicleType,
            model: vehicleModel,
            licensePlate: licensePlate
        };
        user.documents = {
            driversLicense: driversLicense,
            vehicleInsurance: vehicleInsurance
        };
        user.isProfileComplete = true;

        const updatedUser = await user.save();

        res.json({
            _id: updatedUser._id,
            username: updatedUser.username,
            role: updatedUser.role,
            isProfileComplete: updatedUser.isProfileComplete,
            message: "Profile completed successfully"
        });

    } catch (error) {
        console.error("completeProfile Error:", error);
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get all delivery staff
// @route   GET /api/staff/all
// @access  Admin
const getAllStaff = async (req, res) => {
    try {
        const staff = await User.find({ role: 'delivery_staff' }).select('-password');
        res.json(staff);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update staff details
// @route   PUT /api/staff/update/:id
// @access  Admin
const updateStaff = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);

        if (user) {
            user.username = req.body.username || user.username;
            user.email = req.body.email || user.email;
            if (req.body.password) {
                user.password = req.body.password;
            }

            // Allow updating delivery specific fields if needed
            if (req.body.status) user.isOnline = req.body.status === 'online'; // Example mapping

            const updatedUser = await user.save();

            res.json({
                _id: updatedUser._id,
                username: updatedUser.username,
                email: updatedUser.email,
                role: updatedUser.role,
                message: "Staff updated successfully"
            });
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Delete staff
// @route   DELETE /api/staff/delete/:id
// @access  Admin
const deleteStaff = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);

        if (user) {
            await user.deleteOne();
            res.json({ message: 'Staff removed' });
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get single staff profile
// @route   GET /api/staff/profile/:id
// @access  Private
const getProfile = async (req, res) => {
    try {
        const user = await User.findById(req.params.id).select('-password -otp -otpExpires');
        if (user) {
            res.json(user);
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update profile picture
// @route   PUT /api/staff/update-profile-picture
// @access  Private
const updateProfilePicture = async (req, res) => {
    try {
        const { userId, profilePicture } = req.body;

        // For file upload, profilePicture would be a URL/path after multer processes
        // For simplicity, accepting base64 or URL directly
        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        user.profilePicture = profilePicture;
        await user.save();

        res.json({ message: 'Profile picture updated', profilePicture: user.profilePicture });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Toggle online/offline status
// @route   PUT /api/staff/toggle-status
// @access  Private
const toggleStatus = async (req, res) => {
    try {
        const { userId, isOnline } = req.body;

        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        user.isOnline = isOnline;
        await user.save();

        res.json({
            message: `Status updated to ${isOnline ? 'Online' : 'Offline'}`,
            isOnline: user.isOnline
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get rider statistics for dashboard
// @route   GET /api/staff/stats/:id
// @access  Private (Delivery Staff)
const getRiderStats = async (req, res) => {
    try {
        const Order = require('../models/Order');
        const Review = require('../models/Review');
        const riderId = req.params.id;

        const user = await User.findById(riderId);
        if (!user || user.role !== 'delivery_staff') {
            return res.status(404).json({ message: 'Rider not found' });
        }

        // Get today's date range
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        const todayEnd = new Date();
        todayEnd.setHours(23, 59, 59, 999);

        // Get today's completed deliveries
        const todayDeliveries = await Order.countDocuments({
            deliveryRider: riderId,
            status: 'delivered',
            updatedAt: { $gte: todayStart, $lte: todayEnd }
        });

        // Get total completed deliveries
        const totalDeliveries = await Order.countDocuments({
            deliveryRider: riderId,
            status: 'delivered'
        });

        // Calculate today's earnings (assume delivery fee of Rs 50 per order)
        const DELIVERY_FEE_PER_ORDER = 50;
        const todayEarnings = todayDeliveries * DELIVERY_FEE_PER_ORDER;
        const totalEarnings = totalDeliveries * DELIVERY_FEE_PER_ORDER;

        // Get average rating from reviews
        const reviews = await Review.find({ rider: riderId });
        const avgRating = reviews.length > 0
            ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
            : 5.0;

        // Get current active order
        const currentOrder = await Order.findOne({
            deliveryRider: riderId,
            status: { $in: ['picked_up', 'on_the_way'] }
        }).populate('restaurant', 'name address').populate('customer', 'username');

        res.json({
            success: true,
            data: {
                todayDeliveries,
                totalDeliveries,
                todayEarnings,
                totalEarnings,
                avgRating: parseFloat(avgRating),
                reviewCount: reviews.length,
                currentOrder,
                isOnline: user.isOnline
            }
        });
    } catch (error) {
        console.error('getRiderStats Error:', error);
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get rider earnings breakdown (daily/weekly/monthly)
// @route   GET /api/staff/earnings/:id
// @access  Private (Delivery Staff)
const getRiderEarnings = async (req, res) => {
    try {
        const Order = require('../models/Order');
        const riderId = req.params.id;
        const DELIVERY_FEE_PER_ORDER = 50;

        // Date ranges
        const now = new Date();
        const todayStart = new Date(now);
        todayStart.setHours(0, 0, 0, 0);

        const weekStart = new Date(now);
        weekStart.setDate(weekStart.getDate() - 7);

        const monthStart = new Date(now);
        monthStart.setDate(1);
        monthStart.setHours(0, 0, 0, 0);

        // Today's deliveries
        const todayOrders = await Order.countDocuments({
            deliveryRider: riderId,
            status: 'delivered',
            updatedAt: { $gte: todayStart }
        });

        // This week's deliveries
        const weekOrders = await Order.countDocuments({
            deliveryRider: riderId,
            status: 'delivered',
            updatedAt: { $gte: weekStart }
        });

        // This month's deliveries
        const monthOrders = await Order.countDocuments({
            deliveryRider: riderId,
            status: 'delivered',
            updatedAt: { $gte: monthStart }
        });

        // Total all-time deliveries
        const totalOrders = await Order.countDocuments({
            deliveryRider: riderId,
            status: 'delivered'
        });

        // Daily breakdown for last 7 days
        const dailyBreakdown = [];
        for (let i = 6; i >= 0; i--) {
            const dayStart = new Date(now);
            dayStart.setDate(dayStart.getDate() - i);
            dayStart.setHours(0, 0, 0, 0);

            const dayEnd = new Date(dayStart);
            dayEnd.setHours(23, 59, 59, 999);

            const count = await Order.countDocuments({
                deliveryRider: riderId,
                status: 'delivered',
                updatedAt: { $gte: dayStart, $lte: dayEnd }
            });

            dailyBreakdown.push({
                date: dayStart.toISOString().split('T')[0],
                deliveries: count,
                earnings: count * DELIVERY_FEE_PER_ORDER
            });
        }

        res.json({
            success: true,
            data: {
                today: { deliveries: todayOrders, earnings: todayOrders * DELIVERY_FEE_PER_ORDER },
                week: { deliveries: weekOrders, earnings: weekOrders * DELIVERY_FEE_PER_ORDER },
                month: { deliveries: monthOrders, earnings: monthOrders * DELIVERY_FEE_PER_ORDER },
                total: { deliveries: totalOrders, earnings: totalOrders * DELIVERY_FEE_PER_ORDER },
                dailyBreakdown
            }
        });
    } catch (error) {
        console.error('getRiderEarnings Error:', error);
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get rider delivery history
// @route   GET /api/staff/history/:id
// @access  Private (Delivery Staff)
const getRiderHistory = async (req, res) => {
    try {
        const Order = require('../models/Order');
        const riderId = req.params.id;
        const { status, period } = req.query;

        let query = { deliveryRider: riderId };

        // Filter by status
        if (status === 'completed') {
            query.status = 'delivered';
        } else if (status === 'cancelled') {
            query.status = 'cancelled';
        } else {
            query.status = { $in: ['delivered', 'cancelled'] };
        }

        // Filter by period
        if (period) {
            const now = new Date();
            let startDate;
            if (period === 'today') {
                startDate = new Date(now);
                startDate.setHours(0, 0, 0, 0);
            } else if (period === 'week') {
                startDate = new Date(now);
                startDate.setDate(startDate.getDate() - 7);
            } else if (period === 'month') {
                startDate = new Date(now);
                startDate.setMonth(startDate.getMonth() - 1);
            }
            if (startDate) {
                query.updatedAt = { $gte: startDate };
            }
        }

        const orders = await Order.find(query)
            .populate('restaurant', 'name')
            .populate('customer', 'username')
            .sort({ updatedAt: -1 })
            .limit(50);

        const DELIVERY_FEE_PER_ORDER = 50;
        const history = orders.map(order => ({
            _id: order._id,
            orderNumber: order.orderNumber,
            restaurant: order.restaurant?.name || 'Unknown',
            customer: order.customer?.username || 'Customer',
            status: order.status,
            earnings: DELIVERY_FEE_PER_ORDER,
            date: order.updatedAt
        }));

        res.json({
            success: true,
            count: history.length,
            data: history
        });
    } catch (error) {
        console.error('getRiderHistory Error:', error);
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get available (online) riders for order assignment
// @route   GET /api/staff/available
// @access  Restaurant/Admin
const getAvailableRiders = async (req, res) => {
    try {
        const riders = await User.find({
            role: 'delivery_staff',
            isOnline: true,
            isApproved: true,
            isProfileComplete: true
        }).select('_id username profilePicture averageRating completedOrders vehicleDetails currentAssignment');

        // Filter out riders with active assignments (not "None")
        const availableRiders = riders.filter(rider => 
            rider.currentAssignment === 'None' || !rider.currentAssignment
        );

        res.json({
            success: true,
            count: availableRiders.length,
            data: availableRiders
        });
    } catch (error) {
        console.error('getAvailableRiders Error:', error);
        res.status(500).json({ 
            success: false,
            message: error.message 
        });
    }
};

module.exports = {
    addStaff,
    getAllStaff,
    updateStaff,
    deleteStaff,
    completeProfile,
    getProfile,
    updateProfilePicture,
    toggleStatus,
    getRiderStats,
    getRiderEarnings,
    getRiderHistory,
    getAvailableRiders
};
