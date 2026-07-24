const ConsumptionLog = require('../models/ConsumptionLog');

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

module.exports = {
  getWasteDashboard,
  getWeeklySustainabilityReport
};
