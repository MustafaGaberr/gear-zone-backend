const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Product name is required"],
    },
    slug: {
       type: String,
        lowercase: true
       },
    description: {
      type: String,
      required: [true, "Product description is required"],
    },
    price: {
      type: Number,
      required: [true, "Product price is required"],
      min: [1, "Product price must be at least 1"],
      default: 0,
    },
    stock: {
      type: Number,
      required: [true, "Product stock is required"],
      min: [0, "Product stock cannot be negative"],
      default: 0,
    },
    sold: {
      type: Number,
      default: 0,
    },
    category: {
      type: String,
      required: [true, "Product category is required"],
    },
   imageCover: {
      type: String,
      required: [true, "Product Image cover is required"],
    },
    images: [String], 
   seller: 
   {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: [true, "Product must belong to a seller"],
    },
  },
  {
    timestamps: true,
  }
);
// IndexIng for better search performance
productSchema.index({ name: 1, description: 1 }); 
productSchema.index({ slug: 1 }); 
productSchema.index({ price: 1 });
const Product = mongoose.model("Product", productSchema);

module.exports = Product;
