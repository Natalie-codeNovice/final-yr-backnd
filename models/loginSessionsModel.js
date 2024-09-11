module.exports = (sequelize, DataTypes) => {
    const loginSessions = sequelize.define('loginSessions', {
        loggedInAt: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW
        },
        loggedOutAt: {
            type: DataTypes.DATE,
            allowNull: true
        }
    }, {
        timestamps: false
    });
  
    return loginSessions;
};
