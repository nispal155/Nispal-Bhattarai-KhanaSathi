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
        required: true
      },
      addressLine2: {
        type: String
      },
      city: {
        type: String,
        required: true
      },
      state: {
        type: String,
        required: true
      },
      zipCode: {
        type: String,
        required: true
      }
    },

    cuisineType: {
      type: [String], 
      required: true
    },

    openingHour: {
      type: String, 
      required: true
    },

    closingHour: {
      type: String, 
      required: true
    },

    contactPhone: {
      type: String,
      required: true
    },

    contactEmail: {
      type: String,
      required: true,
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

const Restaurant= mongoose.model("Restaurant", restaurantSchema);
module.exports = Restaurant;