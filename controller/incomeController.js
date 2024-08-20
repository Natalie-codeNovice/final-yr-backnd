const db = require('../models');

// Get all expenses for a user
const getIncome = async (req, res) => {
  let userId = req.params.id;
  try {
    const income = await db.transactions.findAll({ where: { userId, type:'income' } });
    if (!income.length) {
      return res.status(404).json({ message: 'No income found' });
    }
    res.status(200).json(income);
  } catch (error) {
    console.error('Error retrieving expenses:', error);
    res.status(500).json({ message: 'Error retrieving expenses', error: error.message || error });
  }
};


module.exports = {
  getIncome
};
