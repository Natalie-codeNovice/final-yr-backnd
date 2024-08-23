const db = require('../models');

const getSavings = async (req, res) => {
  try {
    const userId = req.params.id;
    const savings = await db.savings.findAll({
      where: { isUsed: false },
      include: [
        {
          model: db.transactions,
          as: 'transactions',
          where: { userId },
          attributes: ['id', 'description', 'category']
        }
      ],
      attributes: ['id', 'usageDate', 'isUsed', 'amount'] // Include 'amount' here
    });

    // Check if savings were found
    if (!savings.length) {
      return res.status(404).json({ message: 'No savings found' });
    }

    const totalSavings = savings.reduce((sum, saving) => sum + parseFloat(saving.amount), 0);
    const formattedTotalSavings = totalSavings.toLocaleString('en-US', { style: 'currency', currency: 'USD' });

    res.status(200).json({ savings, totalSavings: formattedTotalSavings });
  } catch (error) {
    console.error('Error retrieving savings:', error);
    res.status(500).json({ message: 'Error retrieving savings', error: error.message || error });
  }
};

module.exports = {
  getSavings
};
