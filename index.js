
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");
const userRoute = require("./routes/user.routes.js");
const productRoute = require("./routes/product.routes.js");
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


