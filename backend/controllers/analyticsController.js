const ConsumptionLog = require('../models/ConsumptionLog');

const toDate = (value) => {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const buildDateMatch = (kitchenId, startDate, endDate) => {
  const match = {};
  if (kitchenId) match.kitchenId = kitchenId;
  const start = toDate(startDate);
  const end = toDate(endDate);
  if (start || end) {
    match.date = {};
    if (start) match.date.$gte = start;
    if (end) {
      const inclusiveEnd = new Date(end);
      inclusiveEnd.setHours(23, 59, 59, 999);
      match.date.$lte = inclusiveEnd;
    }
  }
  return match;
};

const getWasteDashboard = async (req, res, next) => {
  try {
    const { kitchenId, startDate, endDate } = req.query;
    const match = buildDateMatch(kitchenId, startDate, endDate);

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

    const summaryRows = await ConsumptionLog.aggregate([
      { $match: match },
      {
        $group: {
          _id: null,
          totalCooked: { $sum: '$cooked' },
          totalConsumed: { $sum: '$consumed' },
          totalWaste: { $sum: '$leftover' },
          recordCount: { $sum: 1 },
          uniqueDates: { $addToSet: { $dateToString: { format: '%Y-%m-%d', date: '$date' } } }
        }
      }
    ]);

    const summaryRow = summaryRows[0] || {};
    const totalCooked = Number(summaryRow.totalCooked || 0);
    const totalConsumed = Number(summaryRow.totalConsumed || 0);
    const totalWaste = Number(summaryRow.totalWaste || 0);
    const validDays = Array.isArray(summaryRow.uniqueDates) ? summaryRow.uniqueDates.length : 0;
    const wastePercentage = totalCooked > 0 ? Number(((totalWaste / totalCooked) * 100).toFixed(2)) : null;
    const utilizationPercentage = totalCooked > 0 ? Number(((totalConsumed / totalCooked) * 100).toFixed(2)) : null;
    const averageDailyConsumption = validDays > 0 ? Number((totalConsumed / validDays).toFixed(2)) : null;

    return res.status(200).json({
      success: true,
      data: {
        dailyWasteTotals,
        weeklyTrends,
        dishWiseWaste,
        summary: {
          totalCooked,
          totalConsumed,
          totalWaste,
          recordCount: Number(summaryRow.recordCount || 0),
          validDays,
          wastePercentage,
          utilizationPercentage,
          averageDailyConsumption
        }
      }
    });
  } catch (error) {
    return next(error);
  }
};

const getWeeklySustainabilityReport = async (req, res, next) => {
  try {
    const { kitchenId, startDate, endDate } = req.query;
    const now = new Date();
    const periodEnd = toDate(endDate) || now;
    if (endDate && !toDate(endDate)) {
      return res.status(400).json({ success: false, message: 'Invalid endDate' });
    }
    const periodStart = toDate(startDate) || new Date(periodEnd);
    if (startDate) {
      if (!toDate(startDate)) {
        return res.status(400).json({ success: false, message: 'Invalid startDate' });
      }
    } else {
      periodStart.setDate(periodStart.getDate() - 7);
    }
    if (periodStart > periodEnd) {
      return res.status(400).json({ success: false, message: 'startDate must be before endDate' });
    }

    const durationMs = periodEnd.getTime() - periodStart.getTime();
    const previousEnd = new Date(periodStart);
    const previousStart = new Date(periodStart.getTime() - durationMs);

    const currentMatch = {
      date: { $gte: periodStart, $lte: periodEnd }
    };

    const previousMatch = {
      date: { $gte: previousStart, $lt: periodStart }
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

    const periodTotals = await ConsumptionLog.aggregate([
      { $match: currentMatch },
      {
        $group: {
          _id: null,
          totalCooked: { $sum: '$cooked' },
          totalConsumed: { $sum: '$consumed' },
          totalWaste: { $sum: '$leftover' },
          recordCount: { $sum: 1 },
          uniqueDates: { $addToSet: { $dateToString: { format: '%Y-%m-%d', date: '$date' } } }
        }
      }
    ]);

    const totalWaste = currentWeek[0]?.totalWaste || 0;
    const previousWaste = previousWeek[0]?.totalWaste || 0;
    const wasteReductionPercent = previousWaste
      ? Number((((previousWaste - totalWaste) / previousWaste) * 100).toFixed(2))
      : 0;

    const totals = periodTotals[0] || {};
    const totalCooked = Number(totals.totalCooked || 0);
    const totalConsumed = Number(totals.totalConsumed || 0);
    const validDays = Array.isArray(totals.uniqueDates) ? totals.uniqueDates.length : 0;
    const wastePercentage = totalCooked > 0 ? Number(((totalWaste / totalCooked) * 100).toFixed(2)) : null;
    const utilizationPercentage = totalCooked > 0 ? Number(((totalConsumed / totalCooked) * 100).toFixed(2)) : null;
    const averageDailyConsumption = validDays > 0 ? Number((totalConsumed / validDays).toFixed(2)) : null;

    return res.status(200).json({
      success: true,
      data: {
        periodStart,
        periodEnd,
        totalWaste,
        totalCooked,
        totalConsumed,
        wastePercentage,
        utilizationPercentage,
        averageDailyConsumption,
        recordCount: Number(totals.recordCount || 0),
        validDays,
        wasteReductionPercent,
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
