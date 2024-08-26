const db = require('../models');

// Get all income and total income sum for a user
const getIncome = async (req, res) => {
  const userId = req.params.id;
  const page = parseInt(req.query.page) || 1;
  const pageSize = parseInt(req.query.pageSize) || 10;
  const offset = (page - 1) * pageSize;

  try {
    // Fetch income transactions with pagination
    const income = await db.transactions.findAll({ 
      where: { userId, type: 'income' },
      limit: pageSize,
      offset: offset
    });

    // Calculate the total sum of income
    const totalIncome = income.reduce((sum, transaction) => sum + parseFloat(transaction.amount), 0);
    const formattedTotalIncome = totalIncome;

    if (income.length === 0) {
      return res.status(404).json({ message: 'No income found', totalIncome: formattedTotalIncome });
    }

    res.status(200).json({ income, totalIncome: formattedTotalIncome, page, pageSize });
  } catch (error) {
    console.error('Error retrieving income:', error);
    res.status(500).json({ message: 'Error retrieving income', error: error.message || error });
  }
};


module.exports = {
  getIncome
};
