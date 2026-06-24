const { Payment } = require('../models');

const getMonthStart = (date = new Date()) => new Date(date.getFullYear(), date.getMonth(), 1);

const formatMonthKey = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
};

const getLast12MonthsRange = (date = new Date()) => {
  const end = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);
  const start = new Date(date.getFullYear(), date.getMonth() - 11, 1, 0, 0, 0, 0);
  return { start, end };
};

const getSummary = async (req, res, next) => {
  try {
    const now = new Date();
    const monthStart = getMonthStart(now);
    const { start: last12Start, end: last12End } = getLast12MonthsRange(now);

    const [
      totalIncomeAgg,
      monthlyIncomeAgg,
      pendingAgg,
      overdueAgg,
      incomeByMonthAgg,
      incomeByClassAgg
    ] = await Promise.all([
      Payment.aggregate([
        { $match: { status: 'paid' } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]),
      Payment.aggregate([
        {
          $match: {
            status: 'paid',
            paymentDate: { $gte: monthStart, $lte: now }
          }
        },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]),
      Payment.aggregate([
        { $match: { status: 'pending' } },
        { $group: { _id: null, count: { $sum: 1 }, total: { $sum: '$amount' } } }
      ]),
      Payment.aggregate([
        { $match: { status: 'overdue' } },
        { $group: { _id: null, count: { $sum: 1 }, total: { $sum: '$amount' } } }
      ]),
      Payment.aggregate([
        {
          $match: {
            status: 'paid',
            paymentDate: { $gte: last12Start, $lte: last12End }
          }
        },
        {
          $group: {
            _id: {
              year: { $year: '$paymentDate' },
              month: { $month: '$paymentDate' }
            },
            total: { $sum: '$amount' }
          }
        },
        { $sort: { '_id.year': 1, '_id.month': 1 } }
      ]),
      Payment.aggregate([
        { $match: { status: 'paid' } },
        {
          $group: {
            _id: '$className',
            total: { $sum: '$amount' },
            count: { $sum: 1 }
          }
        },
        { $sort: { total: -1, _id: 1 } }
      ])
    ]);

    const monthMap = new Map();
    for (let i = 11; i >= 0; i -= 1) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      monthMap.set(formatMonthKey(d), 0);
    }

    incomeByMonthAgg.forEach((row) => {
      const key = `${row._id.year}-${String(row._id.month).padStart(2, '0')}`;
      if (monthMap.has(key)) {
        monthMap.set(key, row.total || 0);
      }
    });

    const incomeByMonth = Array.from(monthMap.entries()).map(([month, total]) => ({ month, total }));
    const incomeByClass = incomeByClassAgg.map((row) => ({
      className: row._id || 'Unknown',
      total: row.total || 0,
      count: row.count || 0
    }));

    res.json({
      success: true,
      data: {
        totalIncome: totalIncomeAgg[0]?.total || 0,
        monthlyIncome: monthlyIncomeAgg[0]?.total || 0,
        pendingPayments: {
          count: pendingAgg[0]?.count || 0,
          total: pendingAgg[0]?.total || 0
        },
        overduePayments: {
          count: overdueAgg[0]?.count || 0,
          total: overdueAgg[0]?.total || 0
        },
        incomeByMonth,
        incomeByClass
      }
    });
  } catch (error) {
    next(error);
  }
};

const getPaymentsReport = async (req, res, next) => {
  try {
    const query = {};

    if (req.query.academicYear) {
      query.academicYear = new RegExp(req.query.academicYear.trim(), 'i');
    }

    if (req.query.semester) {
      query.semester = Number(req.query.semester);
    }

    if (req.query.className) {
      query.className = new RegExp(req.query.className.trim(), 'i');
    }

    if (req.query.status) {
      query.status = req.query.status;
    }

    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.perPage) || 20;
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      Payment.find(query)
        .sort({ paymentDate: -1, createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .select('receiptNumber studentId studentName className amount paymentDate paymentMethod academicYear semester status remarks')
        .lean(),
      Payment.countDocuments(query)
    ]);

    res.json({
      success: true,
      data: {
        items,
        meta: {
          page,
          limit,
          total
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getSummary,
  getPaymentsReport
};
