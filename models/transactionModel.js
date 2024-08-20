// transactionModel.js
module.exports = (sequelize, DataTypes) => {
  const Transaction = sequelize.define('transactions', {
    description: {
      type: DataTypes.STRING,
      allowNull: false
    },
    amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false
    },
    type: {
      type: DataTypes.ENUM('income', 'expense','saving'),
      allowNull: false
    },
    category: {
      type: DataTypes.STRING,
      allowNull: true
    }
  });

  return Transaction;
};
