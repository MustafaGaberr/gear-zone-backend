
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");
const userRoute = require("./routes/user.routes.js");
const productRoute = require("./routes/product.routes.js");
const chatRoute = require("./routes/chat.routes.js");
const cartRoute = require("./routes/cart.routes.js");
const http = require("http"); 
const { init } = require('./Utilities/socket.js'); 
dotenv.config({ quiet: true });

// Validate required environment variables
const MONGO_URI = process.env.MONGO_URI;
if (!MONGO_URI) {
  console.error("❌ MONGO_URI is not defined in environment variables");
  process.exit(1);
}

//middlewares
const app = express();
app.use(express.json());
app.use(cors());

// Health check endpoint for Fly.io
app.get("/health", (req, res) => {
  res.status(200).json({ 
    status: "ok", 
    message: "Server is running",
    timestamp: new Date().toISOString()
  });
});

//routes
app.use("/api/users", userRoute);
app.use("/api/products", productRoute);
app.use("/api/chat", chatRoute); 
// app.use("/api/cart", cartRoute);


// Create HTTP server
const server = http.createServer(app);

// Initialize Socket.IO (connection handler is already in socket.js)
const io = init(server);

// Start server immediately (don't wait for MongoDB)
const PORT = process.env.PORT || 8080;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Server is listening on port ${PORT} (0.0.0.0)`);
  console.log(`🌐 Health check available at: http://0.0.0.0:${PORT}/health`);
});

// Connect to MongoDB (non-blocking)
mongoose.connect(MONGO_URI)
  .then(() => {
    console.log("✅ Database connected successfully");
  })
  .catch((err) => {
    console.error("❌ Error Connecting to DB:", err);
    // Don't exit - server should still run even if DB connection fails
    // This allows health checks to pass while DB issues are resolved
  });


