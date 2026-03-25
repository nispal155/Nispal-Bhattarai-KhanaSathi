const { ensureSystemSettings, serializeSystemSettings } = require('../utils/systemSettings');

const mergeNotifications = (current, next) => ({
  email: next?.email ?? current?.email ?? true,
  push: next?.push ?? current?.push ?? true,
  sms: next?.sms ?? current?.sms ?? false
});

const mergeGateways = (current, next) => ({
  esewa: next?.esewa ?? current?.esewa ?? true,
  khalti: next?.khalti ?? current?.khalti ?? true,
  cod: next?.cod ?? current?.cod ?? true
});

exports.getSystemSettings = async (req, res) => {
  try {
    const settings = await ensureSystemSettings();

    res.status(200).json({
      success: true,
      data: serializeSystemSettings(settings)
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to load system settings',
      error: error.message
    });
  }
};

exports.updateSystemSettings = async (req, res) => {
  try {
    const settings = await ensureSystemSettings();
    const {
      maintenanceMode,
      guestCheckout,
      notifications,
      currency,
      region,
      paymentGateways
    } = req.body || {};

    if (typeof maintenanceMode === 'boolean') {
      settings.maintenanceMode = maintenanceMode;
    }

    if (typeof guestCheckout === 'boolean') {
      settings.guestCheckout = guestCheckout;
    }

    if (notifications) {
      settings.notifications = mergeNotifications(settings.notifications, notifications);
    }

    if (typeof currency === 'string' && currency.trim()) {
      settings.currency = currency.trim().toUpperCase();
    }

    if (typeof region === 'string' && region.trim()) {
      settings.region = region.trim();
    }

    if (paymentGateways) {
      settings.paymentGateways = mergeGateways(settings.paymentGateways, paymentGateways);
    }

    settings.updatedBy = req.user._id;
    await settings.save();

    res.status(200).json({
      success: true,
      message: 'System settings updated successfully',
      data: serializeSystemSettings(settings)
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update system settings',
      error: error.message
    });
  }
};
