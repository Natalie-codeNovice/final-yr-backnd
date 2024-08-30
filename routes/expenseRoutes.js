const express = require('express');
const router = express.Router();
const {checkToken} = require('../auth/tokenValidation.js')
const expenseController = require('../controller/expenseController.js');
const { authorizeUser } = require('../auth/authenticate.js');
const { addLimit, getAllLimits } = require('../controller/limitsController.js');

router.get('/expense/:id',checkToken,authorizeUser, expenseController.getExpenses );
router.post('/limits/:id',checkToken,authorizeUser, addLimit );
router.get('/limits/:id',checkToken,authorizeUser, getAllLimits );


module.exports = router;
