const ConsumptionLog = require('../models/ConsumptionLog');
const Dish = require('../models/Dish');
const Ingredient = require('../models/Ingredient');

const getWasteDashboard = async (req, res, next) => {
  try {
    const { kitchenId } = req.query;
    const match = kitchenId ? { kitchenId } : {};

    const dailyWasteTotals = await ConsumptionLog.aggregate([
      { $match: match },
      {
        $group: {
          _id: {
            kitchenId: '$kitchenId',
            date: {
              $dateToString: { format: '%Y-%m-%d', date: '$date' }
            }
          },
          totalCooked: { $sum: '$cooked' },
          totalConsumed: { $sum: '$consumed' },
          totalLeftover: { $sum: '$leftover' }
        }
      },
      { $sort: { '_id.date': 1 } }
    ]);

    const weeklyTrends = await ConsumptionLog.aggregate([
      { $match: match },
      {
        $group: {
          _id: {
            kitchenId: '$kitchenId',
            week: { $isoWeek: '$date' },
            year: { $isoWeekYear: '$date' }
          },
          weeklyCooked: { $sum: '$cooked' },
          weeklyConsumed: { $sum: '$consumed' },
          weeklyLeftover: { $sum: '$leftover' }
        }
      },
      { $sort: { '_id.year': 1, '_id.week': 1 } }
    ]);

    const dishWiseWaste = await ConsumptionLog.aggregate([
      { $match: match },
      {
        $group: {
          _id: '$dishId',
          totalLeftover: { $sum: '$leftover' },
          totalCooked: { $sum: '$cooked' }
        }
      },
      {
        $lookup: {
          from: 'dishes',
          localField: '_id',
          foreignField: '_id',
          as: 'dish'
        }
      },
      {
        $project: {
          _id: 1,
          totalLeftover: 1,
          totalCooked: 1,
          dishName: { $arrayElemAt: ['$dish.name', 0] }
        }
      },
      { $sort: { totalLeftover: -1 } }
    ]);

    return res.status(200).json({
      success: true,
      data: {
        dailyWasteTotals,
        weeklyTrends,
        dishWiseWaste
      }
    });
  } catch (error) {
    return next(error);
  }
};

const getWeeklySustainabilityReport = async (req, res, next) => {
  try {
    const { kitchenId } = req.query;
    const now = new Date();
    const sevenDaysAgo = new Date(now);
    sevenDaysAgo.setDate(now.getDate() - 7);

    const previousStart = new Date(sevenDaysAgo);
    previousStart.setDate(previousStart.getDate() - 7);

    const currentMatch = {
      date: { $gte: sevenDaysAgo, $lte: now }
    };

    const previousMatch = {
      date: { $gte: previousStart, $lt: sevenDaysAgo }
    };

    if (kitchenId) {
      currentMatch.kitchenId = kitchenId;
      previousMatch.kitchenId = kitchenId;
    }

    const currentWeek = await ConsumptionLog.aggregate([
      { $match: currentMatch },
      {
        $group: {
          _id: null,
          totalWaste: { $sum: '$leftover' }
        }
      }
    ]);

    const previousWeek = await ConsumptionLog.aggregate([
      { $match: previousMatch },
      {
        $group: {
          _id: null,
          totalWaste: { $sum: '$leftover' }
        }
      }
    ]);

    const totalWaste = currentWeek[0]?.totalWaste || 0;
    const previousWaste = previousWeek[0]?.totalWaste || 0;
    const wasteReductionPercent = previousWaste
      ? Number((((previousWaste - totalWaste) / previousWaste) * 100).toFixed(2))
      : 0;

    const estimatedSavings = Number((totalWaste * 2.8).toFixed(2));

    return res.status(200).json({
      success: true,
      data: {
        periodStart: sevenDaysAgo,
        periodEnd: now,
        totalWaste,
        wasteReductionPercent,
        estimatedSavings
      }
    });
  } catch (error) {
    return next(error);
  }
};

const getDailySavings = async (req, res, next) => {
  try {
    const { kitchenId, date } = req.query;
    const targetDate = date ? new Date(date) : new Date();
    if (Number.isNaN(targetDate.getTime())) {
      return res.status(400).json({ success: false, message: 'Invalid date format. Use YYYY-MM-DD.' });
    }

    const dayStart = new Date(targetDate);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(targetDate);
    dayEnd.setHours(23, 59, 59, 999);

    const todayMatch = { date: { $gte: dayStart, $lte: dayEnd } };
    if (kitchenId) todayMatch.kitchenId = kitchenId;

    const todayLogs = await ConsumptionLog.find(todayMatch).lean();
    if (todayLogs.length === 0) {
      return res.status(200).json({
        success: true,
        data: {
          date: dayStart,
          kitchenId: kitchenId || null,
          baselineWasteCost: 0,
          actualWasteCost: 0,
          moneySaved: 0,
          netImpact: 0,
          dishes: []
        }
      });
    }

    const dishIds = [...new Set(todayLogs.map((log) => String(log.dishId)))];
    const dishDocs = await Dish.find({ _id: { $in: dishIds } }).lean();
    const dishById = new Map(dishDocs.map((d) => [String(d._id), d]));

    const ingredientIds = [...new Set(
      dishDocs.flatMap((dish) => (dish.ingredients || []).map((ing) => String(ing.ingredientId)))
    )];
    const ingredientDocs = await Ingredient.find({ _id: { $in: ingredientIds } })
      .select('_id unitCost')
      .lean();
    const ingredientCostById = new Map(
      ingredientDocs.map((ingredient) => [String(ingredient._id), Number(ingredient.unitCost) || 0])
    );
    const defaultUnitCost = Number(process.env.DEFAULT_INGREDIENT_UNIT_COST || 0);

    const costPerMealByDishId = new Map(
      dishDocs.map((dish) => {
        const dishCost = (dish.ingredients || []).reduce((sum, ing) => {
          const unitCost = ingredientCostById.get(String(ing.ingredientId));
          const effectiveUnitCost = unitCost === undefined ? defaultUnitCost : unitCost;
          return sum + (Number(ing.amountPerMeal) || 0) * effectiveUnitCost;
        }, 0);
        return [String(dish._id), Number(dishCost.toFixed(4))];
      })
    );

    const todayByDish = todayLogs.reduce((acc, log) => {
      const key = String(log.dishId);
      const current = acc.get(key) || { cooked: 0, leftover: 0 };
      current.cooked += Number(log.cooked) || 0;
      current.leftover += Number(log.leftover) || 0;
      acc.set(key, current);
      return acc;
    }, new Map());

    const lookbackStart = new Date(dayStart);
    lookbackStart.setDate(lookbackStart.getDate() - 14);
    const historicalMatch = {
      date: { $gte: lookbackStart, $lt: dayStart }
    };
    if (kitchenId) historicalMatch.kitchenId = kitchenId;

    const historicalByDish = await ConsumptionLog.aggregate([
      { $match: historicalMatch },
      {
        $group: {
          _id: '$dishId',
          totalCooked: { $sum: '$cooked' },
          totalLeftover: { $sum: '$leftover' }
        }
      }
    ]);

    const ratioByDish = new Map(
      historicalByDish.map((row) => {
        const cooked = Number(row.totalCooked) || 0;
        const leftover = Number(row.totalLeftover) || 0;
        return [String(row._id), cooked > 0 ? leftover / cooked : 0];
      })
    );

    const globalHistorical = historicalByDish.reduce((acc, row) => {
      acc.cooked += Number(row.totalCooked) || 0;
      acc.leftover += Number(row.totalLeftover) || 0;
      return acc;
    }, { cooked: 0, leftover: 0 });
    const globalRatio = globalHistorical.cooked > 0 ? globalHistorical.leftover / globalHistorical.cooked : 0;

    const dishes = Array.from(todayByDish.entries()).map(([dishId, today]) => {
      const ratio = ratioByDish.has(dishId) ? ratioByDish.get(dishId) : globalRatio;
      const expectedLeftoverMeals = today.cooked * ratio;
      const costPerMeal = costPerMealByDishId.get(dishId) || 0;
      const actualWasteCost = today.leftover * costPerMeal;
      const baselineWasteCost = expectedLeftoverMeals * costPerMeal;
      const savings = Math.max(0, baselineWasteCost - actualWasteCost);

      return {
        dishId,
        dishName: dishById.get(dishId)?.name || 'Unknown Dish',
        cooked: Number(today.cooked.toFixed(2)),
        actualLeftoverMeals: Number(today.leftover.toFixed(2)),
        expectedLeftoverMeals: Number(expectedLeftoverMeals.toFixed(2)),
        costPerMeal: Number(costPerMeal.toFixed(4)),
        actualWasteCost: Number(actualWasteCost.toFixed(2)),
        baselineWasteCost: Number(baselineWasteCost.toFixed(2)),
        savings: Number(savings.toFixed(2))
      };
    });

    const baselineWasteCost = Number(dishes.reduce((sum, d) => sum + d.baselineWasteCost, 0).toFixed(2));
    const actualWasteCost = Number(dishes.reduce((sum, d) => sum + d.actualWasteCost, 0).toFixed(2));
    const netImpact = Number((baselineWasteCost - actualWasteCost).toFixed(2));
    const moneySaved = Number(Math.max(0, netImpact).toFixed(2));

    return res.status(200).json({
      success: true,
      data: {
        date: dayStart,
        kitchenId: kitchenId || null,
        baselineWasteCost,
        actualWasteCost,
        moneySaved,
        netImpact,
        dishes
      }
    });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  getWasteDashboard,
  getWeeklySustainabilityReport,
  getDailySavings
};
