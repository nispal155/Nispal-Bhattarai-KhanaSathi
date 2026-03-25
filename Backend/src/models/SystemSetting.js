const mongoose = require('mongoose');

const systemSettingSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      default: 'global',
      unique: true
    },
    maintenanceMode: {
      type: Boolean,
      default: false
    },
    guestCheckout: {
      type: Boolean,
      default: true
    },
    notifications: {
      email: { type: Boolean, default: true },
      push: { type: Boolean, default: true },
      sms: { type: Boolean, default: false }
    },
    currency: {
      type: String,
      default: 'NPR'
    },
    region: {
      type: String,
      default: 'Nepal'
    },
    paymentGateways: {
      esewa: { type: Boolean, default: true },
      khalti: { type: Boolean, default: true },
      cod: { type: Boolean, default: true }
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('SystemSetting', systemSettingSchema);
