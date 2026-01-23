
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");
const userRoute = require("./routes/user.routes.js");
const productRoute = require("./routes/product.routes.js");
const chatRoute = require("./routes/chat.routes.js");

const cartRoute = require("./routes/cart.routes.js");
const orderRoute = require("./routes/order.routes.js");
const http = require("http"); 
const { init } = require('./Utilities/socket.js'); 
dotenv.config({ quiet: true });
const MONGO_URI = process.env.MONGO_URI;


//middlewares
const app = express();
app.use(express.json());
app.use(cors());

//routes
app.use("/api/users", userRoute);
app.use("/api/products", productRoute);
app.use("/api/chat", chatRoute); 
app.use("/api/cart", cartRoute);
app.use("/api/orders", orderRoute);


app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ status: "error", message: err.message });
});
//
const server = http.createServer(app);

mongoose.connect(MONGO_URI)
  .then(() => {
    console.log("db connected successfully");

    const io = init(server);

    io.on('connection', (socket) => {
      console.log('Client connected via Socket.io');
    });

  
    server.listen(process.env.PORT, () => {
      console.log(`server is listening on port ${process.env.PORT}`);
    });

  })
  .catch((err) => {
    console.log("Error Connecting to DB:", err);
  });

// "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6InRlc3RAZXhhbXBsZS5jb20iLCJpZCI6IjY5NzIxMDc1MjRkZGJkYWY0YmUyZmViYyIsInJvbGUiOiJidXllciIsImlhdCI6MTc2OTA4MzA5MCwiZXhwIjoxNzY5MTY5NDkwfQ.fEjlVZrjRKNdY1GAihc8fVPUoxG4_yRATP6AC0NqJOY"
