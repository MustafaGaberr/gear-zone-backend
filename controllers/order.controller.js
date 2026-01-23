const Order = require("../models/order.model");
const Product = require("../models/product.model");
const httpstatustext = require("../Utilities/httpstatustext");
const mongoose = require("mongoose");

const createOrder = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { products, shippingAddress } = req.body;
    const userId = req.user.id; // From verifyToken middleware

    if (!products || products.length === 0) {
      return res.status(400).json({ status: httpstatustext.FAIL, message: "No products in order" });
    }

    let totalAmount = 0;
    const orderProducts = [];

    for (const item of products) {
      const product = await Product.findById(item.productId).session(session);
      if (!product) {
        throw new Error(`Product with ID ${item.productId} not found`);
      }
      if (product.stock < item.quantity) {
        throw new Error(`Insufficient stock for product ${product.name}`);
      }

      // Deduct stock and save product
      product.stock -= item.quantity;
      await product.save({ session });

      orderProducts.push({
        productId: item.productId,
        quantity: item.quantity,
        price: product.price, // Capture current price
      });
      totalAmount += product.price * item.quantity;
    }

    // Generate a simple order number (you might want a more robust solution)
    const orderNumber = `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    const newOrder = await Order.create([
      {
        userId,
        products: orderProducts,
        totalAmount,
        orderNumber,
        shippingAddress,
        orderDate: Date.now(),
      },
    ], { session });

    await session.commitTransaction();
    session.endSession();

    res.status(201).json({ status: httpstatustext.SUCCESS, data: { order: newOrder[0] } });
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    res.status(500).json({ status: httpstatustext.ERROR, message: err.message });
  }
};

const getUserOrders = async (req, res) => {
  try {
    const userId = req.user.id; // From verifyToken middleware
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const orders = await Order.find({ userId })
      .populate("products.productId", "name images") // Populate product details
      .sort({ orderDate: -1 })
      .skip(skip)
      .limit(limit);

    const totalOrders = await Order.countDocuments({ userId });

    res.status(200).json({
      status: httpstatustext.SUCCESS,
      data: {
        orders: orders.map(order => ({
          id: order._id,
          orderNumber: order.orderNumber,
          orderDate: order.orderDate,
          status: order.status,
          totalAmount: order.totalAmount,
          trackingNumber: order.trackingNumber,
          shippingAddress: order.shippingAddress,
          products: order.products.map(p => ({
            productId: p.productId._id,
            name: p.productId.name,
            image: p.productId.images, 
            quantity: p.quantity,
            price: p.price,
          })),
        })),
      },
      pagination: {
        page,
        limit,
        totalOrders,
        totalPages: Math.ceil(totalOrders / limit),
      },
    });
  } catch (err) {
    res.status(500).json({ status: httpstatustext.ERROR, message: err.message });
  }
};

const getOrderDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id; 

    const order = await Order.findOne({ _id: id, userId })
      .populate("products.productId", "name images");

    if (!order) {
      return res.status(404).json({ status: httpstatustext.FAIL, message: "Order not found" });
    }

    res.status(200).json({
      status: httpstatustext.SUCCESS,
      data: {
        order: {
          id: order._id,
          orderNumber: order.orderNumber,
          orderDate: order.orderDate,
          status: order.status,
          totalAmount: order.totalAmount,
          trackingNumber: order.trackingNumber,
          shippingAddress: order.shippingAddress,
          products: order.products.map(p => ({
            productId: p.productId._id,
            name: p.productId.name,
            image: p.productId.images,
            quantity: p.quantity,
            price: p.price,
          })),
        },
      },
    });
  } catch (err) {
    res.status(500).json({ status: httpstatustext.ERROR, message: err.message });
  }
};

const updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, trackingNumber } = req.body;

    // Only admin or seller should be allowed to update status. This will be handled by middleware.
    const allowedStatuses = ["Processing", "Delivered", "In Transit", "Cancelled"];
    if (status && !allowedStatuses.includes(status)) {
      return res.status(400).json({ status: httpstatustext.FAIL, message: "Invalid order status" });
    }

    const updatedOrder = await Order.findByIdAndUpdate(
      id,
      { status, trackingNumber },
      { new: true, runValidators: true }
    ).populate("products.productId", "name images");

    if (!updatedOrder) {
      return res.status(404).json({ status: httpstatustext.FAIL, message: "Order not found" });
    }

    res.status(200).json({ status: httpstatustext.SUCCESS, data: { order: updatedOrder } });
  } catch (err) {
    res.status(500).json({ status: httpstatustext.ERROR, message: err.message });
  }
};

module.exports = { createOrder, getUserOrders, getOrderDetails, updateOrderStatus };