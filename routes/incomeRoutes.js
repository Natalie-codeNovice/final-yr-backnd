const express = require('express');
const router = express.Router();
const {checkToken} = require('../auth/tokenValidation.js')
const incomeController = require('../controller/incomeController.js');
const { authorizeUser } = require('../auth/authenticate.js');


router.get('/income/:id',checkToken,authorizeUser,incomeController.getIncome );

//admin roles
router.get('/users/income/:id',checkToken,incomeController.getIncome );
module.exports = router;
