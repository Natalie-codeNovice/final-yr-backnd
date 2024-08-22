const db = require('../models');

// Get the net balance for a user
const getNetBalance = async (req, res) => {
  try {
    const userId = req.user.userId;
    let netBalance = await db.netBalances.findOne({ where: { userId } });

    if (!netBalance) {
      netBalance = { balance: 0.0 }; // Set netBalance to an object with a balance property
    }

    res.status(200).json(netBalance);
  } catch (error) {
    console.error('Error retrieving net balance:', error);
    res.status(500).json({ message: 'Error retrieving net balance', error: error.message || error });
  }
};

module.exports = {
  getNetBalance
};
