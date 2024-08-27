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
      return res.status(404).json({ totalSavings: 0 });
    }

    const totalSavings = savings.reduce((sum, saving) => sum + parseFloat(saving.amount), 0);
    const formattedTotalSavings = totalSavings;

    res.status(200).json({ savings, totalSavings: formattedTotalSavings });
  } catch (error) {
    console.error('Error retrieving savings:', error);
    res.status(500).json({ message: 'Error retrieving savings', error: error.message || error });
  }
};

const useSaving = async (req, res) => {
  try {
    const savingId = req.params.id;
    const saving = await db.savings.findByPk(savingId);
    if (!saving) {
      return res.status(404).json({ message: 'Saving not found' });
    }
    saving.isUsed = true;
    await saving.save();
    return res.status(200).json({ message: 'Saving has been marked as used', saving });
  } catch (error) {
    console.error('Error in useSaving:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};
module.exports = {
  getSavings,
  useSaving
};
