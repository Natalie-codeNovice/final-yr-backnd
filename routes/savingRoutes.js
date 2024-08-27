const express = require('express');
const router = express.Router();
const {checkToken} = require('../auth/tokenValidation.js')
const savingController = require('../controller/savingController.js');
const { authorizeUser } = require('../auth/authenticate.js');

router.get('/saving/:id',checkToken, authorizeUser,savingController.getSavings);
router.put('/saving/use/:id',savingController.useSaving);


module.exports = router;
