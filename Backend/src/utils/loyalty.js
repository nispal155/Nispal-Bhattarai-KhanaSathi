const LOYALTY_EARNING_RUPEES_PER_POINT = 100;
const LOYALTY_POINTS_PER_RUPEE = 10;

const normalizeLoyaltyPoints = (points = 0) => {
  const normalized = Math.floor(Number(points) || 0);
  return Math.max(normalized, 0);
};

const calculatePointsEarned = (orderValue = 0) => (
  Math.max(Math.floor(Number(orderValue || 0) / LOYALTY_EARNING_RUPEES_PER_POINT), 0)
);

const calculateDiscountFromPoints = (points = 0, maxApplicableAmount = Number.MAX_SAFE_INTEGER) => {
  const normalizedPoints = normalizeLoyaltyPoints(points);
  const maxDiscountFromPoints = Math.floor(normalizedPoints / LOYALTY_POINTS_PER_RUPEE);
  const cappedAmount = Math.max(Math.floor(Number(maxApplicableAmount || 0)), 0);

  return Math.max(Math.min(maxDiscountFromPoints, cappedAmount), 0);
};

const calculatePointsNeededForDiscount = (discountAmount = 0) => (
  Math.max(Math.floor(Number(discountAmount || 0)), 0) * LOYALTY_POINTS_PER_RUPEE
);

module.exports = {
  LOYALTY_EARNING_RUPEES_PER_POINT,
  LOYALTY_POINTS_PER_RUPEE,
  normalizeLoyaltyPoints,
  calculatePointsEarned,
  calculateDiscountFromPoints,
  calculatePointsNeededForDiscount
};
