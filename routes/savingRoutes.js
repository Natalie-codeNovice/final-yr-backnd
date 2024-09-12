const express = require('express');
const router = express.Router();
const {checkToken} = require('../auth/tokenValidation.js')
const savingController = require('../controller/savingController.js');
const { authorizeUser } = require('../auth/authenticate.js');

router.get('/saving/:id',checkToken, authorizeUser,savingController.getSavings);
router.put('/saving/use/:id',savingController.useSaving);

//admin roles
router.get('/users/saving/:id',checkToken,savingController.getSavings);
module.exports = router;
