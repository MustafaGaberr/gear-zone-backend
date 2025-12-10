const Product = require("../models/product.model.js");
const Notification = require("../models/notification.model.js");
const { getIO } = require('../Utilities/socket');


const createProduct = async (req, res) => {
  try {
    const product = await Product.create(req.body);

    const notification = new Notification({
      message: `New product added: ${product.name}`,
      type: "product_new",
      link: `/products/${product._id}`,
      isRead: false 
    });
    
    await notification.save();

    getIO().emit("notification", notification);
    // getIO().to(sellerOrAdminId).emit("notification", notification);

    res.status(201).json({
      message: "Product created successfully",
      status: "success",
      code: 201,
      data: product,
    });

  } catch (err) {
    res.status(400).json({ error: err.message, status: "error", code: 400, data: null });
  }
};

const getAllProducts = async (req, res) => {
  try {
    const query = req.query;
    const page = parseInt(query.page) || 1;
    const limit = parseInt(query.limit) || 10;
    const skip = (page - 1) * limit;
    const products = await Product.find({}, { __v: false })
      .limit(limit)
      .skip(skip);
    if (!products)
      return res
        .status(404)
        .json({
          message: "No products found",
          status: "error",
          code: 404,
          data: null,
        });
    res.status(200).json({
      message: "Products retrieved successfully",
      status: "success",
      code: 200,
      data: products,
      pagination: {
        page,
        limit,
        total: products.length,
      }
    });
  } catch (err) {
    res
      .status(400)
      .json({ error: err.message, status: "error", code: 400, data: null });
  }
};

const getProductById = async (req, res) => {
  try {
    const { id } = req.params;
    const product = await Product.findById(id, { __v: false });
    if (!product) {
      return res
        .status(404)
        .json({
          message: "Product not found",
          status: "error",
          code: 404,
          data: null,
        });
    }
    res.status(200).json({
      message: "Product retrieved successfully",
      status: "success",
      code: 200,
      data: product,
    });
  } catch (error) {
    res
      .status(400)
      .json({ error: error.message, status: "error", code: 400, data: null });
  }
};

const updateProductById = async (req, res) => {
  try {
    const { id } = req.params;
    const product = await Product.findByIdAndUpdate(id, req.body);
    if (!product) {
      return res
        .status(404)
        .json({
          message: "Product not found",
          status: "error",
          code: 404,
          data: null,
        });
    }
    //retrieve updated product
    const updatedProduct = await Product.findById(id);
    res.status(200).json({
      message: "Product updated successfully",
      status: "success",
      code: 200,
      data: updatedProduct,
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

const deleteProductById = async (req, res) => {
  try {
    const { id } = req.params;
    const product = await Product.findByIdAndDelete(id);
    if (!product) {
      return res
        .status(404)
        .json({
          message: "Product not found",
          status: "error",
          code: 404,
          data: null,
        });
    }
    res
      .status(200)
      .json({
        message: "Product deleted successfully",
        status: "success",
        code: 200,
        data: null,
      });
  } catch (error) {
    res
      .status(400)
      .json({ error: error.message, status: "error", code: 400, data: null });
  }
};

module.exports = {
  createProduct,
  getAllProducts,
  getProductById,
  updateProductById,
  deleteProductById,
};
