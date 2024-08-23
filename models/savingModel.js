module.exports = (sequelize, DataTypes) => {
    const Saving = sequelize.define('savings', {
      usageDate: {
        type: DataTypes.DATE,
        allowNull: false
    },  
    amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false
    },   
      isUsed: {
        type: DataTypes.BOOLEAN,
        defaultValue:false
    },           
      });
  
    return Saving;
  };
  