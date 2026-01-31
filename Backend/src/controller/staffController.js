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

module.exports = {
    addStaff,
    getAllStaff,
    updateStaff,
    deleteStaff,
    completeProfile,
    getProfile,
    updateProfilePicture,
    toggleStatus
};
