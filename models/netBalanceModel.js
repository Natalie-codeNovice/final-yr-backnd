module.exports = (sequelize, DataTypes) => {
  const NetBalance = sequelize.define('netBalances', {
    balance: {
      type: DataTypes.FLOAT,
      allowNull: false,
      defaultValue: 0,
    },
  });

  return NetBalance;
};
