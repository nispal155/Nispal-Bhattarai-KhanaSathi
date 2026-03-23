const roundCurrency = (value) => Number(Number(value || 0).toFixed(2));

const buildChildOrderHistorySummary = (orders = []) => {
  const nonCancelledOrders = orders.filter((order) => order?.status !== 'cancelled');
  const totalSpent = nonCancelledOrders.reduce((sum, order) => {
    return sum + Number(order?.pricing?.total || 0);
  }, 0);

  const statusBreakdown = orders.reduce((acc, order) => {
    const status = order?.status || 'unknown';
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {});

  return {
    totalOrders: orders.length,
    totalSpent: roundCurrency(totalSpent),
    averageOrderValue: nonCancelledOrders.length > 0
      ? roundCurrency(totalSpent / nonCancelledOrders.length)
      : 0,
    activeOrders: orders.filter((order) => !['delivered', 'cancelled'].includes(order?.status)).length,
    lastOrderAt: orders[0]?.createdAt || null,
    statusBreakdown
  };
};

const buildChildNutritionInsights = (orders = []) => {
  const summary = {
    trackedOrderCount: orders.length,
    totalItems: 0,
    trackedCalories: 0,
    averageCaloriesPerOrder: 0,
    healthyChoiceRate: 0,
    healthyChoiceCount: 0,
    junkFoodItemCount: 0,
    caffeinatedItemCount: 0,
    categoryBreakdown: [],
    allergenExposure: [],
    highlights: []
  };

  if (orders.length === 0) {
    summary.highlights.push('No approved or completed food orders yet.');
    return summary;
  }

  const categoryCounts = new Map();
  const allergenCounts = new Map();

  let calorieTrackedItemCount = 0;

  for (const order of orders) {
    for (const item of order?.items || []) {
      const menuItem = item?.menuItem && typeof item.menuItem === 'object'
        ? item.menuItem
        : null;
      const quantity = Number(item?.quantity || 0);

      if (quantity <= 0) {
        continue;
      }

      summary.totalItems += quantity;

      const calories = Number(menuItem?.calories || 0);
      if (calories > 0) {
        summary.trackedCalories += calories * quantity;
        calorieTrackedItemCount += quantity;
      }

      const isHealthyChoice = Boolean(
        menuItem &&
        menuItem.isJunkFood !== true &&
        menuItem.containsCaffeine !== true &&
        (menuItem.calories === undefined || menuItem.calories === null || Number(menuItem.calories) <= 650)
      );

      if (isHealthyChoice) {
        summary.healthyChoiceCount += quantity;
      }

      if (menuItem?.isJunkFood) {
        summary.junkFoodItemCount += quantity;
      }

      if (menuItem?.containsCaffeine) {
        summary.caffeinatedItemCount += quantity;
      }

      const categoryName = menuItem?.category || 'Other';
      categoryCounts.set(categoryName, (categoryCounts.get(categoryName) || 0) + quantity);

      for (const allergen of menuItem?.allergens || []) {
        allergenCounts.set(allergen, (allergenCounts.get(allergen) || 0) + quantity);
      }
    }
  }

  summary.trackedCalories = roundCurrency(summary.trackedCalories);
  summary.averageCaloriesPerOrder = orders.length > 0
    ? roundCurrency(summary.trackedCalories / orders.length)
    : 0;
  summary.healthyChoiceRate = summary.totalItems > 0
    ? Math.round((summary.healthyChoiceCount / summary.totalItems) * 100)
    : 0;
  summary.categoryBreakdown = [...categoryCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name, count]) => ({ name, count }));
  summary.allergenExposure = [...allergenCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name, count]) => ({ name, count }));

  if (summary.healthyChoiceRate >= 60) {
    summary.highlights.push('Most recent meal picks lean balanced and lower risk.');
  }

  if (summary.junkFoodItemCount > 0) {
    summary.highlights.push(`Junk-food items appeared ${summary.junkFoodItemCount} time(s) in recent orders.`);
  }

  if (summary.caffeinatedItemCount > 0) {
    summary.highlights.push(`Caffeinated items appeared ${summary.caffeinatedItemCount} time(s).`);
  }

  if (summary.categoryBreakdown[0]) {
    summary.highlights.push(`${summary.categoryBreakdown[0].name} is the most-ordered category right now.`);
  }

  if (calorieTrackedItemCount < summary.totalItems) {
    summary.highlights.push('Some menu items still do not include calorie data.');
  }

  if (summary.highlights.length === 0) {
    summary.highlights.push('Nutrition data will become richer as more child orders are placed.');
  }

  return summary;
};

module.exports = {
  buildChildOrderHistorySummary,
  buildChildNutritionInsights
};
