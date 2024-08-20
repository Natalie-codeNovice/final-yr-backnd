const db = require('../models');

// Get all income and total income sum for a user
const getIncome = async (req, res) => {
  const userId = req.params.id;

  try {
    // Fetch all income transactions
    const income = await db.transactions.findAll({ 
      where: { userId, type: 'income' }
    });

    // Calculate the total sum of income
    const totalIncome = income.reduce((sum, transaction) => sum + parseFloat(transaction.amount), 0);

    // Format totalIncome as a currency string
    const formattedTotalIncome = totalIncome.toLocaleString('en-US', { style: 'currency', currency: 'USD' });

    if (income.length === 0) {
      return res.status(404).json({ message: 'No income found', totalIncome: formattedTotalIncome });
    }

    res.status(200).json({ income, totalIncome: formattedTotalIncome });
  } catch (error) {
    console.error('Error retrieving income:', error);
    res.status(500).json({ message: 'Error retrieving income', error: error.message || error });
  }
};

module.exports = {
  getIncome
};
