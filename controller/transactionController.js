const db = require('../models');
const { Op } = require('sequelize');
// Function to handle income transaction
const handleIncome = async (userId, amount) => {
  let netBalance = await db.netBalances.findOne({ where: { userId } });
  if (!netBalance) {
      netBalance = await db.netBalances.create({ balance: amount, userId });
  } else {
      netBalance.balance += parseFloat(amount);
      await netBalance.save();
  }
};

// Function to handle expense transaction
const handleExpense = async (userId, amount) => {
  let netBalance = await db.netBalances.findOne({ where: { userId } });
  if (!netBalance) {
      return false;
  } else {
      netBalance.balance -= parseFloat(amount);
      await netBalance.save();
  }
};

// Function to handle saving transaction
const handleSaving = async (userId, amount) => {
  let netBalance = await db.netBalances.findOne({ where: { userId } });
  if (netBalance) {
      netBalance.balance -= parseFloat(amount);
      await netBalance.save();

      let saving = await db.savings.findOne({ where: { userId } });
      if (!saving) {
          saving = await db.savings.create({ amount, userId });
      } else {
          saving.amount += parseFloat(amount);
          await saving.save();
      }
  }
};

// Create a new transaction
const createTransaction = async (req, res) => {
  const { description, amount, type, category, userId } = req.body;
  try {
      let netBalance = await db.netBalances.findOne({ where: { userId } });

      // Handle transaction based on type
      if (type === 'income') {
          const transaction = await db.transactions.create({
              description,
              amount,
              type,
              category,
              userId
          });
          await handleIncome(userId, amount);
          res.status(201).json({ message: 'Transaction added successfully', transaction });

      } else if (type === 'expense') {
          if (!netBalance) {
              res.status(200).json({ message: "Add income first" });
          } else if (netBalance.balance < parseFloat(amount)) {
              res.status(200).json({ message: "Insufficient Balance" });
          } else {
              const transaction = await db.transactions.create({
                  description,
                  amount,
                  type,
                  category,
                  userId
              });
              await handleExpense(userId, amount);
              res.status(201).json({ message: 'Transaction added successfully', transaction });
          }

      } else if (type === 'saving') {
          if (!netBalance) {
              res.status(200).json({ message: "Add income first" });
          } else if (netBalance.balance < parseFloat(amount)) {
              res.status(200).json({ message: "Insufficient Balance" });
          } else {
              const transaction = await db.transactions.create({
                  description,
                  amount,
                  type,
                  category,
                  userId
              });
              await handleSaving(userId, amount);
              res.status(201).json({ message: 'Transaction added successfully', transaction });
          }
      }

  } catch (error) {
      res.status(500).json({ message: 'Error adding transaction', error });
  }
};


  // Retrieve transactions for a user
const getUserTransactions = async (req, res) => {
    let userId = req.params.id;
    try {
      if (!userId) {
        return res.status(400).json({ message: 'User ID is required' });
      }
      const transactions = await db.transactions.findAll({ where: { userId } });
      res.status(200).json(transactions);
    } catch (error) {
      console.error('Error retrieving transactions:', error);
      res.status(500).json({ message: 'Error retrieving transactions', error: error.message || error });
    }
  };

// Delete a transaction
const deleteTransaction = async (req, res) => {
    try {
        let userId = req.params.id;      
        const deletedCount = await db.transactions.destroy({ where: { userId} });
        if (deletedCount > 0) {
            res.status(200).send('Transaction is deleted');
        } else {
            res.status(404).send('Transaction not found');
        }
    } catch (error) {
        console.error('Error deleting transaction:', error);
        res.status(500).send('Error deleting transaction');
    }
};




// Function to generate daily report for the current day
const generateDailyReport = async (req, res) => {
    const userId = req.params.id;
    const today = new Date();
    const dayStart = new Date(today.setHours(0, 0, 0, 0));
    const dayEnd = new Date(today.setHours(23, 59, 59, 999));

    try {
        const transactions = await db.transactions.findAll({
            where: {
                userId,
                createdAt: {
                    [Op.gte]: dayStart,
                    [Op.lte]: dayEnd
                }
            }
        });

        const netBalance = await db.netBalances.findOne({ where: { userId } });

        const totalIncome = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + parseFloat(t.amount), 0);
        const totalSavings = transactions.filter(t => t.type === 'saving').reduce((sum, t) => sum + parseFloat(t.amount), 0);
        const totalExpenses = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + parseFloat(t.amount), 0);

        res.status(200).json({
            transactions,
            totalIncome,
            totalSavings,
            totalExpenses,
            netBalance: netBalance ? netBalance.balance : 0
        });
    } catch (error) {
        console.error('Error generating daily report:', error);
        res.status(500).json({ message: 'Error generating daily report', error });
    }
};

const generateWeeklyReport = async (req, res) => {
    const userId = req.params.id;
    const today = new Date();
    const dayOfWeek = today.getDay(); // Get the current day of the week (0-6, where 0 is Sunday)
    const diffToMonday = (dayOfWeek === 0 ? 6 : dayOfWeek - 1); // Calculate difference to Monday
    const firstDayOfWeek = new Date(today.setDate(today.getDate() - diffToMonday));
    firstDayOfWeek.setHours(0, 0, 0, 0);
    const lastDayOfWeek = new Date(firstDayOfWeek);
    lastDayOfWeek.setDate(firstDayOfWeek.getDate() + 6);
    lastDayOfWeek.setHours(23, 59, 59, 999);

    try {
        const transactions = await db.transactions.findAll({
            where: {
                userId,
                createdAt: {
                    [Op.gte]: firstDayOfWeek,
                    [Op.lte]: lastDayOfWeek
                }
            }
        });

        const netBalance = await db.netBalances.findOne({ where: { userId } });

        const totalIncome = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + parseFloat(t.amount), 0);
        const totalSavings = transactions.filter(t => t.type === 'saving').reduce((sum, t) => sum + parseFloat(t.amount), 0);
        const totalExpenses = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + parseFloat(t.amount), 0);

        res.status(200).json({
            transactions,
            totalIncome,
            totalSavings,
            totalExpenses,
            netBalance: netBalance ? netBalance.balance : 0
        });
    } catch (error) {
        console.error('Error generating weekly report:', error);
        res.status(500).json({ message: 'Error generating weekly report', error });
    }
};


// Function to generate monthly report for the current month
const generateMonthlyReport = async (req, res) => {
    const userId = req.params.id;
    const today = new Date();
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    firstDayOfMonth.setHours(0, 0, 0, 0);
    const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    lastDayOfMonth.setHours(23, 59, 59, 999);

    try {
        const transactions = await db.transactions.findAll({
            where: {
                userId,
                createdAt: {
                    [Op.gte]: firstDayOfMonth,
                    [Op.lte]: lastDayOfMonth
                }
            }
        });

        const netBalance = await db.netBalances.findOne({ where: { userId } });

        const totalIncome = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + parseFloat(t.amount), 0);
        const totalSavings = transactions.filter(t => t.type === 'saving').reduce((sum, t) => sum + parseFloat(t.amount), 0);
        const totalExpenses = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + parseFloat(t.amount), 0);

        res.status(200).json({
            transactions,
            totalIncome,
            totalSavings,
            totalExpenses,
            netBalance: netBalance ? netBalance.balance : 0
        });
    } catch (error) {
        console.error('Error generating monthly report:', error);
        res.status(500).json({ message: 'Error generating monthly report', error });
    }
};


// Function to generate customizable report for a specified date range and net balance within the range
const generateCustomReportWithNetBalance = async (req, res) => {
    const userId = req.params.id;
    const { startDate, endDate } = req.body;

    if (!startDate || !endDate) {
        return res.status(400).json({ message: 'Start date and end date are required' });
    }

    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    try {
        const transactions = await db.transactions.findAll({
            where: {
                userId,
                createdAt: {
                    [Op.gte]: start,
                    [Op.lte]: end
                }
            }
        });

        const totalIncome = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + parseFloat(t.amount), 0);
        const totalSavings = transactions.filter(t => t.type === 'saving').reduce((sum, t) => sum + parseFloat(t.amount), 0);
        const totalExpenses = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + parseFloat(t.amount), 0);

        const netBalance = totalIncome - (totalExpenses + totalSavings);

        res.status(200).json({
            transactions,
            totalIncome,
            totalSavings,
            totalExpenses,
            netBalance
        });
    } catch (error) {
        console.error('Error generating custom report with net balance:', error);
        res.status(500).json({ message: 'Error generating custom report with net balance', error });
    }
};


module.exports = {
    createTransaction,
    deleteTransaction,
    getUserTransactions,
    generateDailyReport,
    generateWeeklyReport,
    generateMonthlyReport,
    generateCustomReportWithNetBalance
};
