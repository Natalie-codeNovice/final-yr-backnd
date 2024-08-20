const db = require('../models');

// Get the net balance for a user
const getNetBalance = async (req, res) => {
  try {
    const userId = req.user.userId;
    const id = req.params.id;
    if (String(userId) !== String(id)) {
        return res.status(403).json({ message: 'Access denied. You cannot view this user.' });
    }

    const netBalance = await db.netBalances.findOne({ where: { userId } });
    if (!netBalance) {
      return res.status(404).json({ message: 'Net balance not found' });
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
