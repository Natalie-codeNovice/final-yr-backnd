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
db.categories = require('./categoryModel.js')(sequelize, DataTypes);
db.loginSessions = require('./loginSessionsModel.js')(sequelize, DataTypes);
db.cancelledTransactions = require('./cancelledTransactions.js')(sequelize, DataTypes);

// Associations
db.users.hasMany(db.transactions, {
    foreignKey: 'userId',
    as: 'transactions'
});
db.transactions.belongsTo(db.users, {
    foreignKey: 'userId',
    as: 'user'
});


db.users.hasMany(db.loginSessions, {
    foreignKey: 'userId',
    as: 'loginSessions'
});
db.loginSessions.belongsTo(db.users, {
    foreignKey: 'userId',
    as: 'user'
});

db.users.hasMany(db.categories, {
    foreignKey: 'userId',
    as: 'categories'
});
db.categories.belongsTo(db.users, {
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


db.transactions.hasMany(db.savings, {
    foreignKey: 'transactionId',
    as: 'savings'
});
db.savings.belongsTo(db.transactions, {
    foreignKey: 'transactionId',
    as: 'transactions'
});

db.transactions.hasMany(db.cancelledTransactions, {
    foreignKey: 'transactionId',
    as: 'canceledTransactions'     
});
db.cancelledTransactions.belongsTo(db.transactions, {
    foreignKey: 'transactionId',    
    as: 'transaction'               
});

// Sync Models
db.sequelize.sync({ force:false })
.then(() => {
    console.log('Database synchronized successfully.');
})
.catch(err => {
    console.error('Error synchronizing the database:', err);
});

module.exports = db;
