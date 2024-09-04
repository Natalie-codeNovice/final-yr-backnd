const express = require('express');
const router = express.Router();
const {checkToken} = require('../auth/tokenValidation.js')
const transactionController = require('../controller/transactionController.js');
const { authorizeUser } = require('../auth/authenticate.js');

//transactions
router.post('/add/:id',checkToken,authorizeUser, transactionController.createTransaction);
router.get('/transactions/:id',checkToken,authorizeUser, transactionController.getUserTransactions);
router.delete('/transactions/:id', transactionController.deleteTransaction);

//reports
router.get('/day-report/:id',checkToken,authorizeUser, transactionController.generateDailyTransactionsReport);
router.get('/dayly-report/:id',checkToken,authorizeUser, transactionController.generateDayReport);
router.get('/week-report/:id', checkToken,authorizeUser,transactionController.generateWeeklyTransactionsReport);
router.get('/week-chart/:id', checkToken,authorizeUser,transactionController.generateWeeklyReport);
router.get('/month-report/:id',checkToken,authorizeUser, transactionController.generateMonthlyTransactionsReport);
router.get('/month-chart/:id',checkToken,authorizeUser, transactionController.generateMonthlyReport);
router.post('/custom/:id', checkToken,authorizeUser,transactionController.generateCustomTransactionsReportWithNetBalance);

module.exports = router;
