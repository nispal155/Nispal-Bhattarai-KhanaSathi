const User = require('../models/User');
const Order = require('../models/Order');
const Review = require('../models/Review');
const RiderPaymentClaim = require('../models/RiderPaymentClaim');
const bcrypt = require('bcryptjs');
const { sendWelcomeEmail } = require('../services/emailService');
const {
    ACTIVE_CLAIM_STATUSES,
    DELIVERY_FEE_PER_ORDER,
    buildClaimSummary,
    buildRiderEarningsReport,
    getClaimablePeriodData,
    getRiderDeliveredOrders,
    serializeRiderPaymentClaim
} = require('../utils/riderPayments');

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
        const { search, status } = req.query;

        let query = { role: 'delivery_staff' };

        if (search) {
            query.$or = [
                { username: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } }
            ];
        }

        if (status === 'online') {
            query.isOnline = true;
        } else if (status === 'offline') {
            query.isOnline = false;
        }

        const staff = await User.find(query).select('-password').sort({ createdAt: -1 });
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
        const riderId = req.params.id;

        const user = await User.findById(riderId);
        if (!user || user.role !== 'delivery_staff') {
            return res.status(404).json({ message: 'Rider not found' });
        }
        const earningsReport = await buildRiderEarningsReport(riderId);

        // Get average rating from reviews
        const reviews = await Review.find({ rider: riderId });
        const avgRating = reviews.length > 0
            ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
            : 5.0;

        // Get current active order
        const currentOrder = await Order.findOne({
            deliveryRider: riderId,
            status: { $in: ['picked_up', 'on_the_way', 'ready'] }
        }).populate('restaurant', 'name address').populate('customer', 'username');

        res.json({
            success: true,
            data: {
                todayDeliveries: earningsReport.today.deliveries,
                totalDeliveries: earningsReport.total.deliveries,
                todayEarnings: earningsReport.today.earnings,
                totalEarnings: earningsReport.total.earnings,
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
        const riderId = req.params.id;
        const user = await User.findById(riderId).select('role');
        if (!user || user.role !== 'delivery_staff') {
            return res.status(404).json({ success: false, message: 'Rider not found' });
        }

        const earningsReport = await buildRiderEarningsReport(riderId);

        res.json({
            success: true,
            data: earningsReport
        });
    } catch (error) {
        console.error('getRiderEarnings Error:', error);
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get rider claimable payment summary (daily/weekly)
// @route   GET /api/staff/claims/summary
// @access  Private (Delivery Staff)
const getRiderClaimSummary = async (req, res) => {
    try {
        const { referenceDate } = req.query;

        const [daily, weekly] = await Promise.all([
            buildClaimSummary(req.user._id, 'daily', referenceDate),
            buildClaimSummary(req.user._id, 'weekly', referenceDate)
        ]);

        res.json({
            success: true,
            data: {
                daily,
                weekly
            }
        });
    } catch (error) {
        console.error('getRiderClaimSummary Error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Create rider payment claim
// @route   POST /api/staff/claims
// @access  Private (Delivery Staff)
const createRiderPaymentClaim = async (req, res) => {
    try {
        const { periodType = 'daily', referenceDate } = req.body;

        if (!['daily', 'weekly'].includes(periodType)) {
            return res.status(400).json({
                success: false,
                message: 'Claim period must be either daily or weekly'
            });
        }

        const claimData = await getClaimablePeriodData(req.user._id, periodType, referenceDate);

        if (claimData.claimableOrders.length === 0) {
            return res.status(400).json({
                success: false,
                message: `No claimable ${periodType} earnings found for ${claimData.period.periodLabel}`
            });
        }

        const claim = await RiderPaymentClaim.create({
            rider: req.user._id,
            periodType: claimData.period.periodType,
            periodLabel: claimData.period.periodLabel,
            referenceDate: claimData.period.referenceDate,
            periodStart: claimData.period.periodStart,
            periodEnd: claimData.period.periodEnd,
            orderIds: claimData.claimableOrders.map((order) => order._id),
            deliveriesCount: claimData.claimableOrders.length,
            amount: claimData.claimableOrders.length * DELIVERY_FEE_PER_ORDER
        });

        res.status(201).json({
            success: true,
            message: `${periodType === 'weekly' ? 'Weekly' : 'Daily'} payment claim submitted successfully`,
            data: serializeRiderPaymentClaim(claim)
        });
    } catch (error) {
        console.error('createRiderPaymentClaim Error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Get rider payment claim history
// @route   GET /api/staff/claims
// @access  Private (Delivery Staff)
const getRiderPaymentClaims = async (req, res) => {
    try {
        const { status, periodType } = req.query;
        const query = { rider: req.user._id };

        if (status === 'active') {
            query.status = { $in: ACTIVE_CLAIM_STATUSES };
        } else if (status && ['pending', 'approved', 'paid', 'rejected'].includes(status)) {
            query.status = status;
        }

        if (periodType && ['daily', 'weekly'].includes(periodType)) {
            query.periodType = periodType;
        }

        const claims = await RiderPaymentClaim.find(query)
            .sort({ claimedAt: -1 })
            .lean();

        res.json({
            success: true,
            count: claims.length,
            data: claims.map(serializeRiderPaymentClaim)
        });
    } catch (error) {
        console.error('getRiderPaymentClaims Error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Update rider payment claim status
// @route   PUT /api/staff/claims/:claimId/status
// @access  Private (Admin)
const updateRiderPaymentClaimStatus = async (req, res) => {
    try {
        const { status, adminNote } = req.body;

        if (!['approved', 'paid', 'rejected'].includes(status)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid claim status update'
            });
        }

        const claim = await RiderPaymentClaim.findById(req.params.claimId);
        if (!claim) {
            return res.status(404).json({
                success: false,
                message: 'Payment claim not found'
            });
        }

        claim.status = status;
        claim.processedAt = new Date();
        if (typeof adminNote === 'string') {
            claim.adminNote = adminNote.trim();
        }

        await claim.save();

        res.json({
            success: true,
            message: 'Payment claim updated successfully',
            data: serializeRiderPaymentClaim(claim)
        });
    } catch (error) {
        console.error('updateRiderPaymentClaimStatus Error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Get rider delivery history
// @route   GET /api/staff/history/:id
// @access  Private (Delivery Staff)
const getRiderHistory = async (req, res) => {
    try {
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
        const allRiders = await User.find({ role: 'delivery_staff' });

        const onlineCount = allRiders.filter(r => r.isOnline).length;
        const approvedCount = allRiders.filter(r => r.isApproved).length;
        const profileCompleteCount = allRiders.filter(r => r.isProfileComplete).length;

        console.log(`Availability check: Total riders: ${allRiders.length}, Online: ${onlineCount}, Approved: ${approvedCount}, Profile Complete: ${profileCompleteCount}`);

        const riders = await User.find({
            role: 'delivery_staff',
            isOnline: true,
            isApproved: true,
            isProfileComplete: true
        }).select('_id username profilePicture averageRating completedOrders vehicleDetails currentAssignment');

        // Filter out riders with active assignments (not "None")
        const availableRiders = riders.filter(rider =>
            String(rider.currentAssignment).toLowerCase() === 'none' || !rider.currentAssignment
        );

        if (availableRiders.length === 0 && allRiders.length > 0) {
            console.log("No riders available. Reason: " +
                (onlineCount === 0 ? "All offline. " : "") +
                (approvedCount === 0 ? "None approved. " : "") +
                (profileCompleteCount === 0 ? "None have complete profiles." : ""));
        }

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

// @desc    Update rider profile (self-update)
// @route   PUT /api/staff/update-profile/:id
// @access  Private (Delivery Staff)
const updateRiderProfile = async (req, res) => {
    try {
        const { username, phone, vehicleDetails } = req.body;
        const rider = await User.findById(req.params.id);

        if (!rider || rider.role !== 'delivery_staff') {
            return res.status(404).json({ success: false, message: 'Rider not found' });
        }

        if (username) rider.username = username;
        if (phone) rider.phone = phone;
        if (vehicleDetails) {
            rider.vehicleDetails = {
                ...rider.vehicleDetails,
                ...vehicleDetails
            };
        }

        await rider.save();

        res.json({
            success: true,
            message: 'Profile updated successfully',
            data: rider
        });
    } catch (error) {
        console.error('updateRiderProfile Error:', error);
        res.status(500).json({ success: false, message: error.message });
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
    getRiderClaimSummary,
    createRiderPaymentClaim,
    getRiderPaymentClaims,
    updateRiderPaymentClaimStatus,
    getRiderHistory,
    getAvailableRiders,
    updateRiderProfile
};
