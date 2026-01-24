<<<<<<< HEAD
// const express = require('express');
// const router = express.Router();
// const verfiytoken = require("../middleware/verfiyToken");
// const allowedTo = require("../middleware/allowedTo");
// const {
//   addToCart,
//   getLoggedUserCart,
//   removeCartItem,
//   clearCart,
//   updateCartItemQuantity
// } = require('../controllers/cartController');


// router
//   .route('/')
//   .get(getLoggedUserCart)    
//   .post(addToCart)           
//   .delete(clearCart);        
=======
const express = require('express');
const router = express.Router();
const verfiytoken = require("../middleware/verfiyToken");
const allowedTo = require("../middleware/allowedTo");
const {
  addToCart,
  getLoggedUserCart,
  removeCartItem,
  clearCart,
  updateCartItemQuantity
} = require('../controllers/cart.controller.js');

router.use(verfiytoken);
router.use(allowedTo('user'));
router
  .route('/')
  .get(getLoggedUserCart)    
  .post(addToCart)           
  .delete(clearCart);        
>>>>>>> 3fcf3ecf1b2da1e2f4d432d895be0937b937d4b4

// router
//   .route('/:itemId')
//   .delete(removeCartItem)       
//   .put(updateCartItemQuantity); 

// module.exports = router;