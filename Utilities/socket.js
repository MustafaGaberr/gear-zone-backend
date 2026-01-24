const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");

let io;

module.exports = {
  init: (httpServer) => {
    // Socket.IO CORS configuration - matches Express CORS
    const corsOrigin = process.env.CORS_ORIGIN || "*";
    
    io = new Server(httpServer, {
      cors: {
        origin: corsOrigin,
        methods: ["GET", "POST"],
        credentials: true,
        allowedHeaders: ["Content-Type", "Authorization"]
      },
      // Enable transports for Render/Heroku compatibility
      transports: ['websocket', 'polling'],
      // Ping timeout and interval for Render/Heroku
      pingTimeout: 60000,
      pingInterval: 25000
    });

    // Socket.IO Authentication Middleware - requires JWT token
    io.use(async (socket, next) => {
      try {
        const token = socket.handshake.auth.token || socket.handshake.query.token;
        
        if (!token) {
          console.log(`❌ Socket connection rejected: No token provided (${socket.id})`);
          return next(new Error('Authentication error: Token required'));
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        socket.userId = decoded.id;
        socket.userEmail = decoded.email;
        socket.userRole = decoded.role;
        
        console.log(`✅ Socket authenticated: User ${decoded.id} (${decoded.email})`);
        next();
      } catch (err) {
        console.log(`❌ Socket connection rejected: Invalid token (${socket.id})`);
        next(new Error('Authentication error: Invalid token'));
      }
    });

    // Socket.IO connection handler
    io.on("connection", (socket) => {
      const userId = socket.userId;

      console.log(`🔌 New Socket.IO connection: UserID ${userId} (Socket: ${socket.id})`);

      if (userId) {
        socket.join(userId);
        console.log(`✅ User ${userId} joined room via Socket.IO`);
      }
      
      socket.on("disconnect", (reason) => {
        console.log(`🔌 Client disconnected: UserID ${userId}, Socket: ${socket.id}, Reason: ${reason}`);
      });

      socket.on("error", (error) => {
        console.error(`❌ Socket error for UserID ${userId}, Socket: ${socket.id}:`, error);
      });
    });

    return io;
  },
  
  getIO: () => {
    if (!io) {
      throw new Error("Socket.io not initialized! Make sure to call init() first.");
    }
    return io;
  }
};