const db = require('../models');

// Get all savings for a user
const getSavings = async (req, res) => {
  try {
    const userId = req.user.userId;
    const savings = await db.savings.findAll({ where: { userId} });
    if (!savings.length) {
      return res.status(404).json({ message: 'No savings found' });
    }
    res.status(200).json(savings);
  } catch (error) {
    console.error('Error retrieving savings:', error);
    res.status(500).json({ message: 'Error retrieving savings', error: error.message || error });
  }
};


module.exports = {
  getSavings
};
