const mongoose = require('mongoose');



const restaurantSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },

    address: {
      addressLine1: {
        type: String,
      },
      addressLine2: {
        type: String
      },
      city: {
        type: String,
      },
      state: {
        type: String,
      },
      zipCode: {
        type: String,
      },
      coordinates: {
        lat: {
          type: Number,
          default: null
        },
        lng: {
          type: Number,
          default: null
        }
      }
    },

    cuisineType: {
      type: [String],
    },

    openingHour: {
      type: String,
    },

    closingHour: {
      type: String,
    },

    contactPhone: {
      type: String,
    },

    contactEmail: {
      type: String,
      lowercase: true
    },

    logoUrl: {
      type: String
    },

    isActive: {
      type: Boolean,
      default: true
    },

    description: {
      type: String,
      default: ''
    },

    minimumOrder: {
      type: Number,
      default: 0
    },

    deliveryRadius: {
      type: Number,
      default: 5
    },

    staff: [{
      name: { type: String, required: true },
      email: { type: String, required: true },
      phone: { type: String },
      role: { type: String, enum: ['chef', 'cashier', 'waiter', 'manager'], required: true },
      status: { type: String, enum: ['active', 'inactive'], default: 'active' },
      createdAt: { type: Date, default: Date.now }
    }],

    averageRating: {
      type: Number,
      default: 0
    },

    reviewCount: {
      type: Number,
      default: 0
    },

    deliveryTime: {
      min: { type: Number, default: 30 },
      max: { type: Number, default: 45 }
    },

    priceRange: {
      type: String,
      enum: ['Rs.', 'Rs.Rs.', 'Rs.Rs.Rs.', 'Rs.Rs.Rs.Rs.'],
      default: 'Rs.'
    },

    tags: [{
      type: String
    }],

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    }
  },
  {
    timestamps: true
  }
);

const Restaurant = mongoose.model("Restaurant", restaurantSchema);
module.exports = Restaurant;
