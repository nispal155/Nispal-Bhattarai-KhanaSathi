const mongoose = require('mongoose');

/**
 * Payment distribution schema for tracking how payment is split among restaurants
 */
const paymentDistributionSchema = new mongoose.Schema({
    restaurant: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Restaurant',
        required: true
    },
    amount: {
        type: Number,
        required: true
    },
    percentage: {
        type: Number,
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'pending_settlement', 'settled', 'refunded'],
        default: 'pending'
    },
    settledAt: {
        type: Date
    }
});

/**
 * MultiOrder Schema - Groups multiple restaurant orders into a single customer order
 * 
 * This model acts as a parent container when a customer orders from multiple restaurants
 * in a single checkout. Each restaurant's portion becomes a sub-order (Order document).
 */
const multiOrderSchema = new mongoose.Schema({
    // Unique multi-order number (MO-YYYY-XXXX format)
    orderNumber: {
        type: String,
        unique: true
    },

    // Customer who placed the order
    customer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },

    // References to individual restaurant orders
    subOrders: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Order'
    }],

    // Number of restaurants in this order
    restaurantCount: {
        type: Number,
        default: 0
    },

    // Primary rider assigned to handle all pickups and delivery
    primaryRider: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },

    // Aggregated status based on all sub-orders
    status: {
        type: String,
        enum: [
            'pending',              // Just placed, waiting for restaurants
            'partially_confirmed',  // At least one restaurant confirmed
            'all_confirmed',        // All restaurants confirmed
            'preparing',            // At least one restaurant preparing
            'partially_ready',      // At least one restaurant ready
            'all_ready',            // All restaurants ready for pickup
            'picking_up',           // Rider is collecting from restaurants
            'picked_up',            // All sub-orders picked up
            'on_the_way',           // Rider heading to customer
            'delivered',            // Successfully delivered
            'cancelled'             // Order cancelled
        ],
        default: 'pending'
    },

    // Track which sub-orders have been picked up
    pickupStatus: [{
        subOrder: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Order'
        },
        restaurant: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Restaurant'
        },
        isReady: {
            type: Boolean,
            default: false
        },
        isPickedUp: {
            type: Boolean,
            default: false
        },
        readyAt: Date,
        pickedUpAt: Date
    }],

    // Delivery address (same for all sub-orders)
    deliveryAddress: {
        label: String,
        addressLine1: String,
        addressLine2: String,
        city: String,
        state: String,
        zipCode: String,
        coordinates: {
            lat: Number,
            lng: Number
        }
    },

    // Pricing totals (sum of all sub-orders)
    pricing: {
        subtotal: {
            type: Number,
            required: true
        },
        deliveryFee: {
            type: Number,
            default: 0
        },
        serviceFee: {
            type: Number,
            default: 0
        },
        discount: {
            type: Number,
            default: 0
        },
        total: {
            type: Number,
            required: true
        }
    },

    // Payment information
    paymentMethod: {
        type: String,
        enum: ['esewa', 'khalti', 'card', 'bank', 'cod'],
        default: 'cod'
    },
    paymentStatus: {
        type: String,
        enum: ['pending', 'paid', 'failed', 'refunded', 'partially_refunded'],
        default: 'pending'
    },

    // Payment distribution per restaurant
    paymentDistribution: [paymentDistributionSchema],

    // eSewa/Khalti payment tracking (if applicable)
    esewaTransactionId: String,
    esewaRefId: String,
    khaltiPidx: String,
    khaltiRefId: String,

    // Special instructions for the entire order
    specialInstructions: String,

    // Promo code applied (if any)
    promoCode: String,

    // Timing
    estimatedDeliveryTime: Date,
    actualDeliveryTime: Date,

    // Status change history
    statusHistory: [{
        status: String,
        timestamp: {
            type: Date,
            default: Date.now
        },
        note: String
    }],

    // Rider location tracking
    riderLocationHistory: [{
        lat: Number,
        lng: Number,
        timestamp: {
            type: Date,
            default: Date.now
        }
    }]
}, {
    timestamps: true
});

// Generate multi-order number before saving
multiOrderSchema.pre('save', async function () {
    if (!this.orderNumber) {
        const year = new Date().getFullYear();
        const count = await this.constructor.countDocuments();
        this.orderNumber = `MO-${year}-${String(count + 1).padStart(4, '0')}`;
    }

    // Add status to history when status changes
    if (this.isModified('status')) {
        this.statusHistory.push({
            status: this.status,
            timestamp: new Date()
        });
    }

    // Update restaurant count
    if (this.subOrders) {
        this.restaurantCount = this.subOrders.length;
    }
});

// Method to calculate aggregated status from sub-orders
multiOrderSchema.methods.calculateAggregatedStatus = function (subOrderStatuses) {
    const statuses = subOrderStatuses || [];

    if (statuses.every(s => s === 'cancelled')) return 'cancelled';
    if (statuses.every(s => s === 'delivered')) return 'delivered';
    if (statuses.some(s => s === 'on_the_way')) return 'on_the_way';
    if (statuses.every(s => s === 'picked_up' || s === 'on_the_way' || s === 'delivered')) return 'picked_up';
    if (statuses.some(s => s === 'picked_up')) return 'picking_up';
    if (statuses.every(s => s === 'ready')) return 'all_ready';
    if (statuses.some(s => s === 'ready')) return 'partially_ready';
    if (statuses.some(s => s === 'preparing')) return 'preparing';
    if (statuses.every(s => s === 'confirmed' || s === 'preparing' || s === 'ready')) return 'all_confirmed';
    if (statuses.some(s => s === 'confirmed')) return 'partially_confirmed';

    return 'pending';
};

// Method to check if all sub-orders are ready for pickup
multiOrderSchema.methods.allSubOrdersReady = function () {
    return this.pickupStatus.every(ps => ps.isReady);
};

// Method to check if all sub-orders are picked up
multiOrderSchema.methods.allSubOrdersPickedUp = function () {
    return this.pickupStatus.every(ps => ps.isPickedUp);
};

// Indexes for efficient querying
multiOrderSchema.index({ customer: 1, createdAt: -1 });
multiOrderSchema.index({ primaryRider: 1, status: 1 });
multiOrderSchema.index({ status: 1, createdAt: -1 });
multiOrderSchema.index({ orderNumber: 1 });

const MultiOrder = mongoose.model('MultiOrder', multiOrderSchema);

module.exports = MultiOrder;
