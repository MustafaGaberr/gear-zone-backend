const Cart = require('../models/cart.model');
const Product = require('../models/product.model');

// Helper function to create error with status
const createError = (message, status = 500) => {
  const error = new Error(message);
  error.status = status;
  return error;
};

// ---------------------------------------------------------
// 1. Add Product to Cart 
// ---------------------------------------------------------
const addToCart = async (req, res, next) => {
  try {
    const { productId, color, quantity } = req.body;
    const quantityToAdd = quantity || 1;

    const product = await Product.findById(productId);
    
    if (!product) {
      return next(createError("Product not found", 404));
    }

    if (product.stock < quantityToAdd) {
        return next(createError(`Out of stock. Only ${product.stock} left.`, 400));
    }
    // const userId = req.body.user;
    const userId = req.user.id;
    let cart = await Cart.findOne({ user: userId });

    if (!cart) {
      cart = await Cart.create({
        user: userId,
        cartItems: [{ 
            product: productId, 
            color: color, 
            quantity: quantityToAdd, 
            price: product.price       
        }],
      });
    } else {
      
      const productIndex = cart.cartItems.findIndex(
        (item) => item.product.toString() === productId && item.color === color
      );

      if (productIndex > -1) {
        const newQuantity = cart.cartItems[productIndex].quantity + quantityToAdd;
        
        if (product.stock < newQuantity) {
            return next(createError("Cannot add. Limit exceeded stock.", 400));
        }

        cart.cartItems[productIndex].quantity = newQuantity;
      } else {
        cart.cartItems.push({ 
            product: productId, 
            color: color, 
            quantity: quantityToAdd, 
            price: product.price 
        });
      }
    }

    calcTotalCartPrice(cart);

    await cart.save();

    res.status(200).json({
      status: 'success',
      message: 'Product added to cart successfully',
      numOfCartItems: cart.cartItems.length,
      data: cart,
    });

  } catch (error) {
    next(error);
  }
};

// ---------------------------------------------------------
// 2. Get User Cart 
// ---------------------------------------------------------
const getLoggedUserCart = async (req, res, next) => {
  try {
    // const userId = req.body.user;
    const userId = req.user.id;
    const cart = await Cart.findOne({ user: userId })
        .populate('cartItems.product', 'name imageCover price slug'); 

    if (!cart) {
      return next(createError("Cart is empty", 404)); 
    }

    res.status(200).json({
      status: 'success',
      numOfCartItems: cart.cartItems.length,
      data: cart,
    });
  } catch (error) {
    next(error);
  }
};

// ---------------------------------------------------------
// 3. Remove Item from Cart 
// ---------------------------------------------------------
const removeCartItem = async (req, res, next) => {
  try {
    // const userId = req.body.user;
    const userId = req.user.id;
    const cart = await Cart.findOneAndUpdate(
      { user: userId },
      {
        $pull: { cartItems: { _id: req.params.itemId } }, 
      },
      { new: true } 
    );

    if (!cart) {
        return next(createError("Cart not found", 404));
    }

    calcTotalCartPrice(cart);
    await cart.save();

    res.status(200).json({
      status: 'success',
      numOfCartItems: cart.cartItems.length,
      data: cart,
    });
  } catch (error) {
    next(error);
  }
};

// ---------------------------------------------------------
// 4. Update Cart Item Quantity (  + -)
// ---------------------------------------------------------
const updateCartItemQuantity = async (req, res, next) => {
    try {
        const { quantity } = req.body; 
        const { itemId } = req.params;
// const userId = req.body.user;
    const userId = req.user.id;
        const cart = await Cart.findOne({ user: userId });
        if (!cart) return next(createError("Cart not found", 404));

        const itemIndex = cart.cartItems.findIndex(item => item._id.toString() === itemId);

        if (itemIndex > -1) {
            const item = cart.cartItems[itemIndex];
            
            const product = await Product.findById(item.product);
            
            if (product.stock < quantity) {
                 return next(createError(`Out of stock. Max available is ${product.stock}`, 400));
            }

            item.quantity = quantity;
            
            calcTotalCartPrice(cart);
            await cart.save();

            res.status(200).json({
                status: 'success',
                numOfCartItems: cart.cartItems.length,
                data: cart,
            });
        } else {
            return next(createError("Item not found in cart", 404));
        }

    } catch (error) {
        next(error);
    }
}

// ---------------------------------------------------------
// 5. Clear Cart 
// ---------------------------------------------------------
const clearCart = async (req, res, next) => {
    try {
        // const userId = req.body.user;
        const userId = req.user.id;
        const cart = await Cart.findOneAndDelete({ user: userId });

    if (!cart) {
        return next(createError("Cart is already empty or not found", 404));
    }

    res.status(200).json({
        status: 'success',
        message: 'Cart cleared successfully',
        numOfCartItems: 0 
    });
    } catch (error) {
        next(error);
    }
}

// ---------------------------------------------------------
// Helper Function: Calculate Total Price
// ---------------------------------------------------------
const calcTotalCartPrice = (cart) => {
    let totalPrice = 0;
    cart.cartItems.forEach((item) => {
      totalPrice += item.quantity * item.price;
    });
    cart.totalCartPrice = totalPrice;
    cart.totalCartPriceAfterDiscount = undefined;         
};

module.exports = { 
    addToCart, 
    getLoggedUserCart, 
    removeCartItem, 
    updateCartItemQuantity, 
    clearCart 
};