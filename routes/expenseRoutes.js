const express = require('express');
const router = express.Router();
const {checkToken} = require('../auth/tokenValidation.js')
const expenseController = require('../controller/expenseController.js');
const { authorizeUser } = require('../auth/authenticate.js');

router.get('/expense/:id',checkToken,authorizeUser, expenseController.getExpenses );


module.exports = router;
