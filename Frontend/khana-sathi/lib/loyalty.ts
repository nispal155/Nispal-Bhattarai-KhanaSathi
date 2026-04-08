export const LOYALTY_EARNING_RUPEES_PER_POINT = 100;
export const LOYALTY_POINTS_PER_RUPEE = 10;

export const normalizeLoyaltyPoints = (points: number | null | undefined) => (
  Math.max(Math.floor(Number(points || 0)), 0)
);

export const calculateLoyaltyRedeemValue = (points: number | null | undefined) => (
  Math.floor(normalizeLoyaltyPoints(points) / LOYALTY_POINTS_PER_RUPEE)
);

export const calculateRedeemableLoyaltyValue = (
  points: number | null | undefined,
  maxApplicableAmount: number | null | undefined
) => {
  const redeemableValue = calculateLoyaltyRedeemValue(points);
  const cappedAmount = Math.max(Math.floor(Number(maxApplicableAmount || 0)), 0);

  return Math.min(redeemableValue, cappedAmount);
};
