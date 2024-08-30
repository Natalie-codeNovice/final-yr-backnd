
module.exports = (sequelize, DataTypes) => {
    const Category = sequelize.define('categories', {
      categoryName: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      limitAmount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false
      },
      startingDate: {
        type: DataTypes.DATE,
        allowNull: false
      },
      endingDate: {
        type: DataTypes.DATE,
        allowNull: false
      },
      isValid: {
        type: DataTypes.BOOLEAN,
        defaultValue:true
      },
      usageAmount: {
        type: DataTypes.DECIMAL(10, 2),
        defaultValue: 0
      },
      remainedAmount: {
        type: DataTypes.DECIMAL(10, 2),
        defaultValue: 0
      },
      logged50:{
        type: DataTypes.BOOLEAN,
        defaultValue:false
      }, 
      logged80:{
        type: DataTypes.BOOLEAN,
        defaultValue:false
      }, 
      logged100:{
        type: DataTypes.BOOLEAN,
        defaultValue:false
      },                          
    });
  
    return Category;
  };
  