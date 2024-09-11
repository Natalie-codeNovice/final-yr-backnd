
module.exports = (sequelize, DataTypes) => {
    const Admin = sequelize.define('admin', {
        email: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true,
          },
          password: {
            type: DataTypes.STRING,
            allowNull: false,
          },
          role: {
            type: DataTypes.ENUM('superadmin', 'manager', 'auditor'),
            defaultValue: 'manager',
          },                        
    });
  
    return Admin;
  };
  