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