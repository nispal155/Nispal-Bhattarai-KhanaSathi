const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true,
    },
    role: {
        type: String,
        enum: ['admin', 'restaurant', 'delivery_staff', 'customer', 'child'],
        default: 'customer',
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
    },
    password: {
        type: String,
        required: true,
    },
    otp: {
        type: String,
    },
    otpExpires: {
        type: Date,
    },
    isVerified: {
        type: Boolean,
        default: false,
    },
    // Delivery Staff specific fields
    isOnline: {
        type: Boolean,
        default: false
    },
    currentAssignment: {
        type: String,
        default: "None"
    },
    averageRating: {
        type: Number,
        default: 0
    },
    completedOrders: {
        type: Number,
        default: 0
    },
    averageDeliveryTime: {
        type: String,
        default: '0 min'
    },
    // Onboarding Fields
    isProfileComplete: {
        type: Boolean,
        default: false
    },
    vehicleDetails: {
        type: { type: String }, // e.g., 'Motorcycle', 'Scooter'
        model: { type: String },
        licensePlate: { type: String }
    },
    documents: {
        driversLicense: { type: String },
        vehicleInsurance: { type: String }
    },
    profilePicture: {
        type: String,
        default: ''
    },
    isApproved: {
        type: Boolean,
        default: false
    },
    restaurantDocuments: {
        businessLicense: { type: String },
        healthPermit: { type: String },
        taxId: { type: String }
    },
    // Additional customer fields
    phone: {
        type: String
    },
    dateOfBirth: {
        type: Date
    },
    loyaltyPoints: {
        type: Number,
        default: 0
    },
    // Notification preferences
    notifications: {
        push: { type: Boolean, default: true },
        email: { type: Boolean, default: true },
        sms: { type: Boolean, default: false }
    }
}, {
    timestamps: true,
});

// Match user entered password to hashed password in database
userSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

// Encrypt password using bcrypt
userSchema.pre('save', async function () {
    if (!this.isModified('password')) {
        return;
    }

    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

const User = mongoose.model('User', userSchema);

module.exports = User;
