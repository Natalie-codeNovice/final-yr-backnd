const express = require('express');
const router = express.Router();
const {checkToken} = require('../auth/tokenValidation.js')
const netBalanceController = require('../controller/netBalanceController.js');
const { authorizeUser } = require('../auth/authenticate.js');

router.get('/balance/:id',checkToken,authorizeUser, netBalanceController.getNetBalance );

//admin roles
router.get('/balance/:id',checkToken,netBalanceController.getNetBalance );

module.exports = router;
