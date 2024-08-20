const db = require('../models');

// Get all expenses and total expenses sum for a user
const getExpenses = async (req, res) => {
    try {
        const userId = req.user.userId; // Extract user ID from the token
        
        // Fetch all expense transactions
        const expenses = await db.transactions.findAll({ 
            where: { userId, type: 'expense' } 
        });
        
        // Calculate the total sum of expenses
        const totalExpenses = expenses.reduce((sum, transaction) => sum + parseFloat(transaction.amount), 0);

        // Format totalExpenses as a currency string
        const formattedTotalExpenses = totalExpenses.toLocaleString('en-US', { style: 'currency', currency: 'USD' });

        if (expenses.length === 0) {
            return res.status(404).json({ message: 'No expenses found', totalExpenses: formattedTotalExpenses });
        }
        
        res.status(200).json({ expenses, totalExpenses: formattedTotalExpenses });
    } catch (error) {
        console.error('Error retrieving expenses:', error);
        res.status(500).json({ message: 'Error retrieving expenses', error: error.message || error });
    }
};

module.exports = {
    getExpenses
};
