const { Server } = require("socket.io");

let io;

module.exports = {

  init: (httpServer) => {
    io = new Server(httpServer, {
      cors: {
        origin: "*", 
        methods: ["GET", "POST"]
      }
    });

   io.on("connection", (socket) => {
    const userId = socket.handshake.query.id;

    console.log(`New connection attempt from UserID: ${userId}`);

    if (userId && userId !== "undefined") {
        socket.join(userId);
        console.log(`✅ User ${userId} Auto-Joined room via Handshake`);
    } else {
        console.log("⚠️ Connection without valid User ID");
    }
    
    socket.on("disconnect", () => {
        console.log("Client disconnected", socket.id);
    });
});

    return io;
  },
  
  getIO: () => {
    if (!io) {
      throw new Error("Socket.io not initialized!");
    }
    return io;
  }
};