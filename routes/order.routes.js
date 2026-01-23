const express = require("express");
const router = express.Router();
const {
  createOrder,
  getUserOrders,
  getOrderDetails,
  updateOrderStatus,
} = require("../controllers/order.controller");
const verifyToken = require("../middleware/verfiyToken");
const allowedTo = require("../middleware/allowedTo");

// Create a new order (requires authentication)
router.post("/", verifyToken, createOrder);

// Get all orders for the authenticated user
router.get("/my-orders", verifyToken, getUserOrders);

// Get details of a specific order (requires authentication, user must own the order)
router.get("/:id", verifyToken, getOrderDetails);

// Update order status (requires authentication and 'admin' or 'seller' role)
router.patch("/:id", verifyToken, allowedTo("admin", "seller"), updateOrderStatus);

module.exports = router;