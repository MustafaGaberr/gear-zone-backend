// const mongoose = require("mongoose");

// const cartSchema = new mongoose.Schema(
//   {
//     cartItems: [
//       {
//         product: {
//           type: mongoose.Schema.ObjectId,
//           ref: "Product", 
//           required: [true, "Cart item must belong to a product"],
//         },
//         quantity: {
//           type: Number,
//           default: 1,
//         },
//         color: String, 
//         price: Number, 
//       },
//     ],

//     totalCartPrice: {
//       type: Number,
//       default: 0,
//     },

//     totalCartPriceAfterDiscount: {
//       type: Number,
//       default: undefined,
//     },

//     user: {
//       type: mongoose.Schema.ObjectId,
//       ref: "User", 
//       required: [true, "Cart must belong to a user"],
//     },
//   },
//   { timestamps: true } 
// );

// module.exports = mongoose.model("Cart", cartSchema);