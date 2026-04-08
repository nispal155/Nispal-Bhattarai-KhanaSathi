const Order = require('../models/Order');
const MultiOrder = require('../models/MultiOrder');
const RiderPaymentClaim = require('../models/RiderPaymentClaim');

const DELIVERY_FEE_PER_ORDER = 50;
const ACTIVE_CLAIM_STATUSES = ['pending', 'approved', 'paid'];

const toValidDate = (value) => {
  const parsed = value ? new Date(value) : new Date();
  return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
};

const startOfDay = (value) => {
  const date = new Date(value);
  date.setHours(0, 0, 0, 0);
  return date;
};

const endOfDay = (value) => {
  const date = new Date(value);
  date.setHours(23, 59, 59, 999);
  return date;
};

const startOfWeek = (value) => {
  const date = startOfDay(value);
  const day = date.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  date.setDate(date.getDate() + diff);
  return date;
};

const endOfWeek = (value) => {
  const date = startOfWeek(value);
  date.setDate(date.getDate() + 6);
  return endOfDay(date);
};

const startOfMonth = (value) => {
  const date = startOfDay(value);
  date.setDate(1);
  return date;
};

const formatShortDate = (value) => (
  new Date(value).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  })
);

const formatPeriodLabel = (periodType, periodStart, periodEnd) => {
  if (periodType === 'weekly') {
    return `${formatShortDate(periodStart)} - ${formatShortDate(periodEnd)}`;
  }

  return formatShortDate(periodStart);
};

const getCompletionDate = (entity) => (
  new Date(entity?.actualDeliveryTime || entity?.updatedAt || entity?.createdAt || 0)
);

const isWithinRange = (date, startDate, endDate) => {
  const timestamp = date.getTime();

  if (startDate && timestamp < startDate.getTime()) {
    return false;
  }

  if (endDate && timestamp > endDate.getTime()) {
    return false;
  }

  return true;
};

const getPeriodWindow = (periodType = 'daily', referenceDate = new Date()) => {
  const resolvedReferenceDate = toValidDate(referenceDate);

  if (periodType === 'weekly') {
    const periodStart = startOfWeek(resolvedReferenceDate);
    const periodEnd = endOfWeek(resolvedReferenceDate);

    return {
      periodType,
      referenceDate: resolvedReferenceDate,
      periodStart,
      periodEnd,
      periodLabel: formatPeriodLabel(periodType, periodStart, periodEnd)
    };
  }

  const periodStart = startOfDay(resolvedReferenceDate);
  const periodEnd = endOfDay(resolvedReferenceDate);

  return {
    periodType: 'daily',
    referenceDate: resolvedReferenceDate,
    periodStart,
    periodEnd,
    periodLabel: formatPeriodLabel('daily', periodStart, periodEnd)
  };
};

const serializeRiderPaymentClaim = (claim) => {
  if (!claim) {
    return null;
  }

  return {
    _id: claim._id?.toString?.() || claim._id,
    rider: claim.rider?._id?.toString?.() || claim.rider?.toString?.() || claim.rider,
    periodType: claim.periodType,
    periodLabel: claim.periodLabel || formatPeriodLabel(claim.periodType, claim.periodStart, claim.periodEnd),
    referenceDate: claim.referenceDate ? new Date(claim.referenceDate).toISOString() : null,
    periodStart: claim.periodStart ? new Date(claim.periodStart).toISOString() : null,
    periodEnd: claim.periodEnd ? new Date(claim.periodEnd).toISOString() : null,
    deliveriesCount: Number(claim.deliveriesCount || 0),
    amount: Number(claim.amount || 0),
    status: claim.status,
    claimedAt: claim.claimedAt ? new Date(claim.claimedAt).toISOString() : null,
    processedAt: claim.processedAt ? new Date(claim.processedAt).toISOString() : null,
    adminNote: claim.adminNote || '',
    orderIds: Array.isArray(claim.orderIds)
      ? claim.orderIds.map((orderId) => orderId?._id?.toString?.() || orderId?.toString?.() || orderId)
      : [],
    createdAt: claim.createdAt ? new Date(claim.createdAt).toISOString() : null,
    updatedAt: claim.updatedAt ? new Date(claim.updatedAt).toISOString() : null
  };
};

const getClaimedOrderIdSet = async (riderId, statuses = ACTIVE_CLAIM_STATUSES) => {
  const claims = await RiderPaymentClaim.find({
    rider: riderId,
    status: { $in: statuses }
  })
    .select('orderIds')
    .lean();

  const claimedOrderIds = new Set();

  for (const claim of claims) {
    for (const orderId of claim.orderIds || []) {
      claimedOrderIds.add(orderId.toString());
    }
  }

  return claimedOrderIds;
};

const getRiderDeliveredOrders = async (riderId, options = {}) => {
  const { startDate, endDate } = options;

  const [directOrders, deliveredMultiOrders] = await Promise.all([
    Order.find({
      deliveryRider: riderId,
      status: 'delivered'
    })
      .select('_id orderNumber actualDeliveryTime updatedAt createdAt')
      .lean(),
    MultiOrder.find({
      primaryRider: riderId,
      status: 'delivered'
    })
      .select('subOrders')
      .lean()
  ]);

  const multiOrderSubOrderIds = [
    ...new Set(
      deliveredMultiOrders
        .flatMap((multiOrder) => multiOrder.subOrders || [])
        .map((orderId) => orderId.toString())
    )
  ];

  const multiOrderSubOrders = multiOrderSubOrderIds.length > 0
    ? await Order.find({
      _id: { $in: multiOrderSubOrderIds },
      status: 'delivered'
    })
      .select('_id orderNumber actualDeliveryTime updatedAt createdAt')
      .lean()
    : [];

  const uniqueOrders = new Map();

  for (const order of [...directOrders, ...multiOrderSubOrders]) {
    uniqueOrders.set(order._id.toString(), order);
  }

  return Array.from(uniqueOrders.values())
    .map((order) => {
      const deliveredAt = getCompletionDate(order);
      return {
        _id: order._id.toString(),
        orderNumber: order.orderNumber,
        deliveredAt: deliveredAt.toISOString(),
        amount: DELIVERY_FEE_PER_ORDER
      };
    })
    .filter((order) => isWithinRange(new Date(order.deliveredAt), startDate, endDate))
    .sort((a, b) => new Date(b.deliveredAt).getTime() - new Date(a.deliveredAt).getTime());
};

const getClaimablePeriodData = async (riderId, periodType, referenceDate) => {
  const period = getPeriodWindow(periodType, referenceDate);
  const [deliveredOrders, claimedOrderIds, existingClaim] = await Promise.all([
    getRiderDeliveredOrders(riderId, {
      startDate: period.periodStart,
      endDate: period.periodEnd
    }),
    getClaimedOrderIdSet(riderId),
    RiderPaymentClaim.findOne({
      rider: riderId,
      periodType: period.periodType,
      periodStart: period.periodStart,
      periodEnd: period.periodEnd,
      status: { $in: ACTIVE_CLAIM_STATUSES }
    })
      .sort({ claimedAt: -1 })
      .lean()
  ]);

  const claimableOrders = deliveredOrders.filter((order) => !claimedOrderIds.has(order._id));
  const alreadyClaimedOrders = deliveredOrders.filter((order) => claimedOrderIds.has(order._id));

  return {
    period,
    deliveredOrders,
    claimableOrders,
    alreadyClaimedOrders,
    existingClaim
  };
};

const buildClaimSummary = async (riderId, periodType, referenceDate) => {
  const claimData = await getClaimablePeriodData(riderId, periodType, referenceDate);

  return {
    periodType: claimData.period.periodType,
    periodLabel: claimData.period.periodLabel,
    referenceDate: claimData.period.referenceDate.toISOString(),
    periodStart: claimData.period.periodStart.toISOString(),
    periodEnd: claimData.period.periodEnd.toISOString(),
    deliveries: claimData.claimableOrders.length,
    amount: claimData.claimableOrders.length * DELIVERY_FEE_PER_ORDER,
    claimedDeliveries: claimData.alreadyClaimedOrders.length,
    claimedAmount: claimData.alreadyClaimedOrders.length * DELIVERY_FEE_PER_ORDER,
    existingClaim: serializeRiderPaymentClaim(claimData.existingClaim)
  };
};

const buildRiderEarningsReport = async (riderId) => {
  const deliveredOrders = await getRiderDeliveredOrders(riderId);
  const now = new Date();
  const todayStart = startOfDay(now);
  const weekStart = startOfWeek(now);
  const monthStart = startOfMonth(now);

  const countInRange = (startDate, endDate) => (
    deliveredOrders.filter((order) => isWithinRange(new Date(order.deliveredAt), startDate, endDate)).length
  );

  const todayDeliveries = countInRange(todayStart, endOfDay(now));
  const weekDeliveries = countInRange(weekStart, endOfDay(now));
  const monthDeliveries = countInRange(monthStart, endOfDay(now));
  const totalDeliveries = deliveredOrders.length;

  const dailyBreakdown = [];
  for (let offset = 6; offset >= 0; offset -= 1) {
    const date = new Date(now);
    date.setDate(date.getDate() - offset);
    const periodStart = startOfDay(date);
    const periodEnd = endOfDay(date);
    const deliveries = countInRange(periodStart, periodEnd);

    dailyBreakdown.push({
      date: periodStart.toISOString().split('T')[0],
      deliveries,
      earnings: deliveries * DELIVERY_FEE_PER_ORDER
    });
  }

  return {
    today: {
      deliveries: todayDeliveries,
      earnings: todayDeliveries * DELIVERY_FEE_PER_ORDER
    },
    week: {
      deliveries: weekDeliveries,
      earnings: weekDeliveries * DELIVERY_FEE_PER_ORDER
    },
    month: {
      deliveries: monthDeliveries,
      earnings: monthDeliveries * DELIVERY_FEE_PER_ORDER
    },
    total: {
      deliveries: totalDeliveries,
      earnings: totalDeliveries * DELIVERY_FEE_PER_ORDER
    },
    dailyBreakdown
  };
};

module.exports = {
  ACTIVE_CLAIM_STATUSES,
  DELIVERY_FEE_PER_ORDER,
  buildClaimSummary,
  buildRiderEarningsReport,
  getClaimablePeriodData,
  getPeriodWindow,
  getRiderDeliveredOrders,
  serializeRiderPaymentClaim
};
