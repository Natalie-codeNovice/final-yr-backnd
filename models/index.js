const { Sequelize, DataTypes } = require('sequelize');
const dbconfig = require('../config/dbconfig');

// Use config here

const sequelize = new Sequelize(
    dbconfig.DB,
    dbconfig.USER,
    dbconfig.PASSWORD, {
        host: dbconfig.HOST,
        dialect: dbconfig.dialect,
        dialectOptions: {
            ssl: false
        }
    }
);

sequelize.authenticate()
.then(() => {
    console.log('Connection successful.');
})
.catch(err => {
    console.error('Unable to connect to the database:', err);
});

const db = {};
db.Sequelize = Sequelize;
db.sequelize = sequelize;
db.users = require('./userModel.js')(sequelize, DataTypes);
db.transactions = require('./transactionModel.js')(sequelize, DataTypes);
db.netBalances = require('./netBalanceModel.js')(sequelize, DataTypes);
db.savings = require('./savingModel.js')(sequelize, DataTypes);

// Associations
db.users.hasMany(db.transactions, {
    foreignKey: 'userId',
    as: 'transactions'
});
db.transactions.belongsTo(db.users, {
    foreignKey: 'userId',
    as: 'user'
});

db.users.hasOne(db.netBalances, {
    foreignKey: 'userId',
    as: 'netBalance'
});
db.netBalances.belongsTo(db.users, {
    foreignKey: 'userId',
    as: 'user'
});


db.users.hasOne(db.savings, {
    foreignKey: 'userId',
    as: 'savings'
});
db.savings.belongsTo(db.users, {
    foreignKey: 'userId',
    as: 'user'
});

// Sync Models
db.sequelize.sync({ force: false })
.then(() => {
    console.log('Database synchronized successfully.');
})
.catch(err => {
    console.error('Error synchronizing the database:', err);
});

module.exports = db;
