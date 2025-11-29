const express = require("express");
const router = express.Router();
const {
  createProduct,
  getAllProducts,
  getProductById,
  updateProductById,
  deleteProductById,
} = require("../controllers/product.controller.js");

//CRUD Operations for Products

//CREATE - POST /api/products
router.post("/", createProduct);

//READ - GET /api/products
router.get("/", getAllProducts);

//READ - GET /api/products/:id
router.get("/:id", getProductById);

//UPDATE - PUT /api/products/:id
router.put("/:id", updateProductById);

//DELETE - DELETE /api/products/:id
router.delete("/:id", deleteProductById);
module.exports = router;
