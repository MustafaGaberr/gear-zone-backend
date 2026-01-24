const express = require("express");
const router = express.Router();
const verifyToken = require("../middleware/verfiyToken");
const allowedTo = require("../middleware/allowedTo");

const {
  createProduct,
  getAllProducts,
  getProductById,
  updateProductById,
  deleteProductById,
} = require("../controllers/product.controller.js");
const upload = require('../cloudinary');
// ---------------------------------------------------------
// 1. Public Routes
// ---------------------------------------------------------
router.route("/")
  .get(getAllProducts) 
  .post(
    verifyToken, 
    allowedTo("admin", "seller"), 
    upload.array('images', 5),
    createProduct
  );

router.route("/:id")
  .get(getProductById) 
  .put(
    verifyToken, 
    allowedTo("admin", "seller"), 
    upload.array('images', 5),
    updateProductById
  )
  .delete(
    verifyToken, 
    allowedTo("admin", "seller"), 
    deleteProductById
  );

module.exports = router;