const express = require("express");
const route = express.Router();

const {Register,Login,getALluser,updateUser,deleteUser,forgotPassword,verifyPasswordResetCode,resetPassword,deactivateAccount,ActiveAccount} = require("../controllers/user.controller");

const verfiytoken = require("../middleware/verfiyToken");
const allowedTo = require("../middleware/allowedTo");

route.post('/register',allowedTo('buyer','seller') ,Register);
route.post('/login', Login);


route.post('/forgotpassword', forgotPassword);
route.post('/verifedresetCode', verifyPasswordResetCode);
route.put('/resetpassword', resetPassword);


route.get('/', verfiytoken, allowedTo('admin'), getALluser);

route.put('/:id', updateUser);
route.delete('/:id', verfiytoken,allowedTo('admin'), deleteUser);

route.patch('/deactivate',verfiytoken, deactivateAccount);
route.patch('/activate',verfiytoken , ActiveAccount);

module.exports=route