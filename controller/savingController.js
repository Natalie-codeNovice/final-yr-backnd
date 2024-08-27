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

    // Find the saving by its ID
    const saving = await db.savings.findByPk(savingId);

    if (!saving) {
      return res.status(404).json({ message: 'Saving not found' });
    }

    if (saving.isUsed) {
      return res.status(400).json({ message: 'Saving has already been used' });
    }

    // Find the transaction associated with the saving
    const transaction = await db.transactions.findByPk(saving.transactionId);

    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }

    // Find the net balance for the user
    const netBalance = await db.netBalances.findOne({ where: { userId: transaction.userId } });

    if (!netBalance) {
      return res.status(404).json({ message: 'Net balance not found for the user' });
    }

    // Update the saving to mark it as used
    saving.isUsed = true;
    await saving.save();

    // Update the user's net balance
    netBalance.balance += parseFloat(saving.amount);
    await netBalance.save();

    return res.status(200).json({
      message: 'Saving has been marked as used and net balance updated',
      saving,
      netBalance
    });
  } catch (error) {
    console.error('Error in useSaving:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

module.exports = {
  getSavings,
  useSaving
};
