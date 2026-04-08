const Order = require('../models/Order');
const { calculateDiscountFromPoints } = require('./loyalty');

const ALLERGEN_OPTIONS = [
  'Dairy',
  'Eggs',
  'Fish',
  'Shellfish',
  'Tree Nuts',
  'Peanuts',
  'Wheat',
  'Soy',
  'Sesame'
];

const DEFAULT_SPENDING_LIMITS = {
  daily: null,
  weekly: null,
  monthly: null
};

const DEFAULT_FOOD_RESTRICTIONS = {
  blockJunkFood: false,
  blockCaffeine: false,
  blockedAllergens: []
};

const normalizeCurrencyValue = (value, label) => {
  if (value === undefined || value === null || value === '') {
    return null;
  }

  const parsedValue = Number(value);
  if (!Number.isFinite(parsedValue) || parsedValue < 0) {
    const error = new Error(`${label} must be a valid non-negative number`);
    error.statusCode = 400;
    throw error;
  }

  return Number(parsedValue.toFixed(2));
};

const normalizeAllergens = (allergens = []) => {
  if (allergens === undefined || allergens === null || allergens === '') {
    return [];
  }

  if (!Array.isArray(allergens)) {
    const error = new Error('Blocked allergens must be provided as a list');
    error.statusCode = 400;
    throw error;
  }

  const normalized = [...new Set(
    allergens
      .map((allergen) => String(allergen || '').trim())
      .filter(Boolean)
  )];

  const invalid = normalized.filter((allergen) => !ALLERGEN_OPTIONS.includes(allergen));
  if (invalid.length > 0) {
    const error = new Error(`Unsupported allergen restrictions: ${invalid.join(', ')}`);
    error.statusCode = 400;
    throw error;
  }

  return normalized;
};

const normalizeSpendingLimits = (limits = {}) => ({
  daily: normalizeCurrencyValue(limits.daily, 'Daily spending limit'),
  weekly: normalizeCurrencyValue(limits.weekly, 'Weekly spending limit'),
  monthly: normalizeCurrencyValue(limits.monthly, 'Monthly spending limit')
});

const normalizeFoodRestrictions = (restrictions = {}) => ({
  blockJunkFood: Boolean(restrictions.blockJunkFood),
  blockCaffeine: Boolean(restrictions.blockCaffeine),
  blockedAllergens: normalizeAllergens(restrictions.blockedAllergens)
});

const normalizeChildControls = (payload = {}) => ({
  spendingLimits: normalizeSpendingLimits(payload.spendingLimits),
  foodRestrictions: normalizeFoodRestrictions(payload.foodRestrictions)
});

const getChildControls = (user) => {
  const childProfile = user?.childProfile || {};
  return {
    spendingLimits: {
      ...DEFAULT_SPENDING_LIMITS,
      ...(childProfile.spendingLimits || {})
    },
    foodRestrictions: {
      ...DEFAULT_FOOD_RESTRICTIONS,
      ...(childProfile.foodRestrictions || {}),
      blockedAllergens: Array.isArray(childProfile.foodRestrictions?.blockedAllergens)
        ? childProfile.foodRestrictions.blockedAllergens
        : []
    }
  };
};

const getRestrictionReasonsForMenuItem = (menuItem, childUser) => {
  if (!childUser || childUser.role !== 'child') {
    return [];
  }

  const { foodRestrictions } = getChildControls(childUser);
  const reasons = [];

  if (foodRestrictions.blockJunkFood && menuItem?.isJunkFood) {
    reasons.push('Blocked by parent: junk food');
  }

  if (foodRestrictions.blockCaffeine && menuItem?.containsCaffeine) {
    reasons.push('Blocked by parent: contains caffeine');
  }

  const itemAllergens = Array.isArray(menuItem?.allergens) ? menuItem.allergens : [];
  const blockedAllergens = itemAllergens.filter((allergen) =>
    foodRestrictions.blockedAllergens.includes(allergen)
  );

  if (blockedAllergens.length > 0) {
    reasons.push(`Blocked by parent allergen restriction: ${blockedAllergens.join(', ')}`);
  }

  return reasons;
};

const filterMenuItemsForChild = (menuItems, childUser) =>
  (Array.isArray(menuItems) ? menuItems : []).filter(
    (menuItem) => getRestrictionReasonsForMenuItem(menuItem, childUser).length === 0
  );

const getPeriodStarts = (referenceDate = new Date()) => {
  const dayStart = new Date(referenceDate);
  dayStart.setHours(0, 0, 0, 0);

  const weekStart = new Date(dayStart);
  weekStart.setDate(dayStart.getDate() - dayStart.getDay());

  const monthStart = new Date(dayStart.getFullYear(), dayStart.getMonth(), 1);

  return { dayStart, weekStart, monthStart };
};

const getChildSpendingUsage = async (childUserId, referenceDate = new Date()) => {
  const { dayStart, weekStart, monthStart } = getPeriodStarts(referenceDate);

  const orders = await Order.find({
    customer: childUserId,
    status: { $ne: 'cancelled' },
    createdAt: { $gte: monthStart }
  }).select('createdAt pricing.total');

  return orders.reduce(
    (totals, order) => {
      const total = Number(order?.pricing?.total || 0);
      const createdAt = new Date(order.createdAt);

      if (createdAt >= dayStart) {
        totals.daily += total;
      }

      if (createdAt >= weekStart) {
        totals.weekly += total;
      }

      totals.monthly += total;
      return totals;
    },
    { daily: 0, weekly: 0, monthly: 0 }
  );
};

const getChildSpendingSnapshot = async (childUser, referenceDate = new Date()) => {
  if (!childUser || childUser.role !== 'child') {
    return {
      daily: { limit: null, used: 0, remaining: null },
      weekly: { limit: null, used: 0, remaining: null },
      monthly: { limit: null, used: 0, remaining: null }
    };
  }

  const usage = await getChildSpendingUsage(childUser._id, referenceDate);
  const { spendingLimits } = getChildControls(childUser);

  return {
    daily: {
      limit: spendingLimits.daily,
      used: Number(Number(usage.daily || 0).toFixed(2)),
      remaining: spendingLimits.daily === null
        ? null
        : Number(Math.max(spendingLimits.daily - usage.daily, 0).toFixed(2))
    },
    weekly: {
      limit: spendingLimits.weekly,
      used: Number(Number(usage.weekly || 0).toFixed(2)),
      remaining: spendingLimits.weekly === null
        ? null
        : Number(Math.max(spendingLimits.weekly - usage.weekly, 0).toFixed(2))
    },
    monthly: {
      limit: spendingLimits.monthly,
      used: Number(Number(usage.monthly || 0).toFixed(2)),
      remaining: spendingLimits.monthly === null
        ? null
        : Number(Math.max(spendingLimits.monthly - usage.monthly, 0).toFixed(2))
    }
  };
};

const calculateCartTotals = (cart, useLoyaltyPoints = false, userLoyaltyPoints = 0) => {
  let subtotal = 0;

  for (const group of cart.restaurantGroups || []) {
    for (const item of group.items || []) {
      subtotal += Number(item.price || 0) * Number(item.quantity || 0);
    }
  }

  const deliveryFee = (cart.restaurantGroups || []).length * 50;
  const serviceFee = (cart.restaurantGroups || []).length * 20;
  const promoDiscount = Number(cart.promoDiscount || 0);

  let loyaltyDiscount = 0;
  if (useLoyaltyPoints && userLoyaltyPoints > 0) {
    const remainingTotal = subtotal + deliveryFee + serviceFee - promoDiscount;
    loyaltyDiscount = calculateDiscountFromPoints(userLoyaltyPoints, remainingTotal);
  }

  const total = Math.max(0, subtotal + deliveryFee + serviceFee - promoDiscount - loyaltyDiscount);

  return { subtotal, deliveryFee, serviceFee, promoDiscount, loyaltyDiscount, total };
};

const assertChildCanPurchaseTotal = async (childUser, projectedTotal) => {
  if (!childUser || childUser.role !== 'child') {
    return {
      ok: true,
      usage: { daily: 0, weekly: 0, monthly: 0 },
      limits: DEFAULT_SPENDING_LIMITS
    };
  }

  const { spendingLimits } = getChildControls(childUser);
  const usage = await getChildSpendingUsage(childUser._id);

  const violations = [];

  if (spendingLimits.daily !== null && usage.daily + projectedTotal > spendingLimits.daily) {
    violations.push(`Daily limit reached (limit Rs. ${spendingLimits.daily})`);
  }

  if (spendingLimits.weekly !== null && usage.weekly + projectedTotal > spendingLimits.weekly) {
    violations.push(`Weekly limit reached (limit Rs. ${spendingLimits.weekly})`);
  }

  if (spendingLimits.monthly !== null && usage.monthly + projectedTotal > spendingLimits.monthly) {
    violations.push(`Monthly limit reached (limit Rs. ${spendingLimits.monthly})`);
  }

  if (violations.length > 0) {
    const error = new Error(violations[0]);
    error.statusCode = 403;
    error.code = 'CHILD_SPENDING_LIMIT_REACHED';
    error.details = {
      usage,
      limits: spendingLimits,
      projectedTotal
    };
    throw error;
  }

  return {
    ok: true,
    usage,
    limits: spendingLimits
  };
};

module.exports = {
  ALLERGEN_OPTIONS,
  DEFAULT_SPENDING_LIMITS,
  DEFAULT_FOOD_RESTRICTIONS,
  normalizeChildControls,
  getChildControls,
  getRestrictionReasonsForMenuItem,
  filterMenuItemsForChild,
  getChildSpendingUsage,
  getChildSpendingSnapshot,
  calculateCartTotals,
  assertChildCanPurchaseTotal
};
