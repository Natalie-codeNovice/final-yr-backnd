const db = require('../models');
const getExpenses = async (req, res) => {
    try {
        const userId = req.user.userId;
        const expenses = await db.transactions.findAll({ 
            where: { userId, type: 'expense',isCancelled:false } 
        });
        const totalExpenses = expenses.reduce((sum, transaction) => sum + parseFloat(transaction.amount), 0);
        const formattedTotalExpenses = totalExpenses;
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
