const express = require('express');
const router = express.Router();
const {checkToken} = require('../auth/tokenValidation.js')
const transactionController = require('../controller/transactionController.js');
const { authorizeUser } = require('../auth/authenticate.js');

//transactions
router.post('/add', checkToken,authorizeUser,transactionController.createTransaction);
router.get('/transactions/:id',checkToken,authorizeUser, transactionController.getUserTransactions);
router.delete('/transactions/:id', transactionController.deleteTransaction);

//reports
router.get('/day-report/:id', transactionController.generateDailyReport);
router.get('/week-report/:id', transactionController.generateWeeklyReport);
router.get('/month-report/:id', transactionController.generateMonthlyReport);
router.get('/custom/:id', transactionController.generateCustomReportWithNetBalance);

module.exports = router;
