const SystemSetting = require('../models/SystemSetting');

const DEFAULT_SYSTEM_SETTINGS = Object.freeze({
  maintenanceMode: false,
  guestCheckout: true,
  notifications: {
    email: true,
    push: true,
    sms: false
  },
  currency: 'NPR',
  region: 'Nepal',
  paymentGateways: {
    esewa: true,
    khalti: true,
    cod: true
  }
});

const cloneDefaults = () => JSON.parse(JSON.stringify(DEFAULT_SYSTEM_SETTINGS));

const serializeSystemSettings = (settings) => ({
  maintenanceMode: settings?.maintenanceMode ?? DEFAULT_SYSTEM_SETTINGS.maintenanceMode,
  guestCheckout: settings?.guestCheckout ?? DEFAULT_SYSTEM_SETTINGS.guestCheckout,
  notifications: {
    email: settings?.notifications?.email ?? DEFAULT_SYSTEM_SETTINGS.notifications.email,
    push: settings?.notifications?.push ?? DEFAULT_SYSTEM_SETTINGS.notifications.push,
    sms: settings?.notifications?.sms ?? DEFAULT_SYSTEM_SETTINGS.notifications.sms
  },
  currency: settings?.currency || DEFAULT_SYSTEM_SETTINGS.currency,
  region: settings?.region || DEFAULT_SYSTEM_SETTINGS.region,
  paymentGateways: {
    esewa: settings?.paymentGateways?.esewa ?? DEFAULT_SYSTEM_SETTINGS.paymentGateways.esewa,
    khalti: settings?.paymentGateways?.khalti ?? DEFAULT_SYSTEM_SETTINGS.paymentGateways.khalti,
    cod: settings?.paymentGateways?.cod ?? DEFAULT_SYSTEM_SETTINGS.paymentGateways.cod
  },
  updatedBy: settings?.updatedBy || null,
  updatedAt: settings?.updatedAt || null
});

const ensureSystemSettings = async () => {
  let settings = await SystemSetting.findOne({ key: 'global' });

  if (!settings) {
    settings = await SystemSetting.create({
      key: 'global',
      ...cloneDefaults()
    });
  }

  return settings;
};

const isPaymentGatewayEnabled = async (gateway) => {
  const settings = await ensureSystemSettings();
  return Boolean(settings?.paymentGateways?.[gateway]);
};

module.exports = {
  DEFAULT_SYSTEM_SETTINGS,
  ensureSystemSettings,
  serializeSystemSettings,
  isPaymentGatewayEnabled
};
