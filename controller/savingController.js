const db = require('../models');

// Get all savings and total savings sum for a user
const getSavings = async (req, res) => {
  // Retrieve userId from URL params and pagination details from query
  const userId = req.params.id;
  const page = parseInt(req.query.page) || 1;
  const pageSize = parseInt(req.query.pageSize) || 10;
  const offset = (page - 1) * pageSize;

  try {
    // Fetch savings transactions with pagination
    const savings = await db.transactions.findAll({ 
      where: { userId, type: 'saving' },
      limit: pageSize,
      offset: offset,
      attributes: ['id', 'amount', 'description', 'createdAt'], // Include description in the response
      order: [['createdAt', 'DESC']], // Optional: Order by date
    });

    // Calculate the total sum of savings
    const totalSavings = savings.reduce((sum, transaction) => sum + parseFloat(transaction.amount), 0);
    const formattedTotalSavings = totalSavings.toLocaleString('en-US', { style: 'currency', currency: 'USD' });

    if (savings.length === 0) {
      return res.status(404).json({ message: 'No savings found', totalSavings: formattedTotalSavings });
    }

    // Return the savings data, total savings, and pagination details
    res.status(200).json({ savings, totalSavings: formattedTotalSavings, page, pageSize });
  } catch (error) {
    // Handle and log errors
    console.error('Error retrieving savings:', error);
    res.status(500).json({ message: 'Error retrieving savings', error: error.message || error });
  }
};

module.exports = {
  getSavings
};
