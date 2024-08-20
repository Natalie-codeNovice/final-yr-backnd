module.exports = (sequelize, DataTypes) => {
    const Saving = sequelize.define('savings', {
        amount: {
          type: DataTypes.FLOAT,
          allowNull: false,
        },
      });
  
    return Saving;
  };
  