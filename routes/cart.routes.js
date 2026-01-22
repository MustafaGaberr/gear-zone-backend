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


router
  .route('/')
  .get(getLoggedUserCart)    
  .post(addToCart)           
  .delete(clearCart);        

router
  .route('/:itemId')
  .delete(removeCartItem)       
  .put(updateCartItemQuantity); 

module.exports = router;