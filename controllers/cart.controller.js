const Cart = require('../models/cart.model');
const Product = require('../models/product.model');

// ---------------------------------------------------------
// 1. Add Product to Cart 
// ---------------------------------------------------------
const addToCart = async (req, res) => {
  try {
    const { productId, color, quantity } = req.body;
    const quantityToAdd = quantity || 1;

    const product = await Product.findById(productId);
    
    if (!product) {
      return res.status(404).json({ msg: "Product not found" });
    }

    if (product.stock < quantityToAdd) {
        return res.status(400).json({ msg: `Out of stock. Only ${product.stock} left.` });
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
            return res.status(400).json({ msg: `Cannot add. Limit exceeded stock.` });
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
    res.status(500).json({ msg: error.message });
  }
};

// ---------------------------------------------------------
// 2. Get User Cart 
// ---------------------------------------------------------
const getLoggedUserCart = async (req, res) => {
  try {
    // const userId = req.body.user;
    const userId = req.user.id;
    const cart = await Cart.findOne({ user: userId })
        .populate('cartItems.product', 'name imageCover price slug'); 

    if (!cart) {
      return res.status(404).json({ msg: "Cart is empty" }); 
    }

    res.status(200).json({
      status: 'success',
      numOfCartItems: cart.cartItems.length,
      data: cart,
    });
  } catch (error) {
    res.status(500).json({ msg: error.message });
  }
};

// ---------------------------------------------------------
// 3. Remove Item from Cart 
// ---------------------------------------------------------
const removeCartItem = async (req, res) => {
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
        return res.status(404).json({ msg: "Cart not found" });
    }

    calcTotalCartPrice(cart);
    await cart.save();

    res.status(200).json({
      status: 'success',
      numOfCartItems: cart.cartItems.length,
      data: cart,
    });
  } catch (error) {
    res.status(500).json({ msg: error.message });
  }
};

// ---------------------------------------------------------
// 4. Update Cart Item Quantity (  + -)
// ---------------------------------------------------------
const updateCartItemQuantity = async (req, res) => {
    try {
        const { quantity } = req.body; 
        const { itemId } = req.params;
// const userId = req.body.user;
    const userId = req.user.id;
        const cart = await Cart.findOne({ user: userId });
        if (!cart) return res.status(404).json({ msg: "Cart not found" });

        const itemIndex = cart.cartItems.findIndex(item => item._id.toString() === itemId);

        if (itemIndex > -1) {
            const item = cart.cartItems[itemIndex];
            
            const product = await Product.findById(item.product);
            
            if (product.stock < quantity) {
                 return res.status(400).json({ msg: `Out of stock. Max available is ${product.stock}` });
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
            return res.status(404).json({ msg: "Item not found in cart" });
        }

    } catch (error) {
        res.status(500).json({ msg: error.message });
    }
}

// ---------------------------------------------------------
// 5. Clear Cart 
// ---------------------------------------------------------
const clearCart = async (req, res) => {
    try {
        // const userId = req.body.user;
        const userId = req.user.id;
        const cart = await Cart.findOneAndDelete({ user: userId });

    if (!cart) {
        return res.status(404).json({ 
            status: 'fail',
            message: 'Cart is already empty or not found' 
        });
    }

    res.status(200).json({
        status: 'success',
        message: 'Cart cleared successfully',
        numOfCartItems: 0 
    });
    } catch (error) {
        res.status(500).json({ msg: error.message });
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