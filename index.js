const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");
const http = require("http");
const userRoute = require("./routes/user.routes.js");
const productRoute = require("./routes/product.routes.js");
const chatRoute = require("./routes/chat.routes.js");
const cartRoute = require("./routes/cart.routes.js");
const orderRoute = require("./routes/order.routes.js");
const { init } = require('./Utilities/socket.js');

dotenv.config({ quiet: true });

const MONGO_URI = process.env.MONGO_URI;
const PORT = process.env.PORT || 3000;

// Initialize Express app
const app = express();

// CORS configuration - allow all origins for development, configure for production
const corsOptions = {
  origin: process.env.CORS_ORIGIN || "*",
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
};

// Middlewares
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint for Heroku
app.get("/health", (req, res) => {
  res.status(200).json({ 
    status: "ok", 
    message: "Server is running",
    timestamp: new Date().toISOString()
  });
});

// API Routes with logging
app.use("/api/users", (req, res, next) => {
  console.log(` [${req.method}] ${req.path}`);
  next();
}, userRoute);

app.use("/api/products", (req, res, next) => {
  console.log(` [${req.method}] ${req.path}`);
  next();
}, productRoute);

app.use("/api/chat", (req, res, next) => {
  console.log(` [${req.method}] ${req.path}`);
  next();
}, chatRoute);

app.use("/api/cart", (req, res, next) => {
  console.log(` [${req.method}] ${req.path}`);
  next();
}, cartRoute);

app.use("/api/orders", (req, res, next) => {
  console.log(` [${req.method}] ${req.path}`);
  next();
}, orderRoute);

// Root endpoint - API Documentation
app.get("/", (req, res) => {
  res.json({ 
    message: "Gear Zone Backend API", 
    version: "1.0.0",
    status: "running",
    documentation: {
      baseUrl: `${req.protocol}://${req.get('host')}`,
      endpoints: {
        health: "GET /health - Server health check",
        authentication: {
          register: "POST /api/users/register - Register new user",
          login: "POST /api/users/login - User login",
          forgotPassword: "POST /api/users/forgotpassword - Request password reset",
          verifyResetCode: "POST /api/users/verifedresetCode - Verify reset code",
          resetPassword: "PUT /api/users/resetpassword - Reset password"
        },
        users: {
          getAll: "GET /api/users - Get all users (Admin only)",
          update: "PUT /api/users/:id - Update user",
          delete: "DELETE /api/users/:id - Delete user (Admin only)",
          deactivate: "PATCH /api/users/deactivate - Deactivate account",
          activate: "PATCH /api/users/activate - Activate account"
        },
        products: {
          getAll: "GET /api/products - Get all products",
          getById: "GET /api/products/:id - Get product by ID",
          create: "POST /api/products - Create product",
          update: "PUT /api/products/:id - Update product",
          delete: "DELETE /api/products/:id - Delete product"
        },
        chat: {
          sendMessage: "POST /api/chat/send - Send message (Auth required)",
          getHistory: "GET /api/chat/history/:friendId - Get chat history (Auth required)",
          getConversations: "GET /api/chat/conversations/:userId - Get user conversations (Auth required)"
        },
        cart: {
          getCart: "GET /api/cart - Get user cart (Auth required)",
          addToCart: "POST /api/cart - Add item to cart (Auth required)",
          updateQuantity: "PUT /api/cart/:itemId - Update cart item quantity (Auth required)",
          removeItem: "DELETE /api/cart/:itemId - Remove item from cart (Auth required)",
          clearCart: "DELETE /api/cart - Clear cart (Auth required)"
        },
        orders: {
          create: "POST /api/orders - Create order (Auth required)",
          getMyOrders: "GET /api/orders/my-orders - Get user orders (Auth required)",
          getOrder: "GET /api/orders/:id - Get order details (Auth required)",
          updateStatus: "PATCH /api/orders/:id - Update order status (Admin/Seller only)"
        },
        socketIO: {
          connection: "WebSocket connection with JWT token in auth.token or query.token",
          events: {
            private_message: "Receive private message",
            notification: "Receive notification"
          }
        }
      },
      authentication: {
        method: "Bearer Token (JWT)",
        header: "Authorization: Bearer <token>",
        socketIO: "Token in socket.handshake.auth.token or socket.handshake.query.token"
      },
      timestamp: new Date().toISOString()
    }
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ 
    status: "error", 
    message: "Route not found" 
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(`❌ Error [${req.method} ${req.path}]:`, {
    message: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
  
  res.status(err.status || 500).json({
    status: "error",
    message: err.message || "Internal server error",
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// Create HTTP server
const server = http.createServer(app);

// Initialize Socket.IO (connection handler is in socket.js)
const io = init(server);

// Connect to MongoDB and start server
mongoose.connect(MONGO_URI, {
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
  retryWrites: true
})
  .then(() => {
    console.log("✅ Database connected successfully");

    // Start server
    server.listen(PORT, () => {
      console.log(` Server is listening on port ${PORT}`);
      console.log(` Socket.IO server initialized`);
      console.log(` Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(` API Documentation: http://localhost:${PORT}/`);
      console.log(`  Health Check: http://localhost:${PORT}/health`);
    });
  })
  .catch((err) => {
    console.error("❌ Error connecting to database:", err);
    process.exit(1);
  });

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
    mongoose.connection.close(false, () => {
      console.log('MongoDB connection closed');
      process.exit(0);
    });
  });
});
