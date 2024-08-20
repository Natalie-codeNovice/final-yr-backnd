const db = require('../models');

// Get all expenses for a user
const getExpenses = async (req, res) => {
    try {
        const userId = req.user.userId; // Extract user ID from the token
        const expenses = await db.transactions.findAll({ where: { userId, type: 'expense' } });
        
        if (!expenses.length) {
            return res.status(404).json({ message: 'No expenses found' });
        }
        
        res.status(200).json(expenses);
    } catch (error) {
        console.error('Error retrieving expenses:', error);
        res.status(500).json({ message: 'Error retrieving expenses', error: error.message || error });
    }
};

module.exports = {
    getExpenses
};
