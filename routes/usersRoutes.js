const userController = require('../controller/userController.js')
const {checkToken} = require('../auth/tokenValidation.js')
const { authorizeUser } = require('../auth/authenticate.js');
const { addUser } = require('../controller/admin/adminController.js');
const adminRoles = require('../controller/admin/userController.js')
const router = require('express').Router()
router.post('/signup', userController.addUser)
router.post('/admin-signup', addUser)
router.post('/login', userController.loginUser)
router.post('/forgot-password',userController.forgotPassword)
router.get('/verify-email',userController.verifyEmail)

router.post('/logout/:id',checkToken,authorizeUser,userController.logoutUser)
router.get('/:id',checkToken,authorizeUser, userController.getOneUser)
router.put('/:id',checkToken,authorizeUser, userController.updateUser)
router.put('/password/:id',checkToken,authorizeUser, userController.updatePassword)
router.delete('/:id',checkToken,authorizeUser, userController.deleteUser)

//admin roles
router.post('/users',checkToken,adminRoles.getAllUsers)
router.get('/users/:id',checkToken,adminRoles.getOneUser)
router.delete('/users/:id',checkToken,adminRoles.deleteUser)
router.put('/users/:id',checkToken,adminRoles.updateUser)
router.get('/user-sessions/:id',checkToken,adminRoles.getUserSessions)


module.exports = router
