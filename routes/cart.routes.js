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
router.use(allowedTo('user', 'buyer'));
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