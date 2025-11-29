const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const userRoute = require("./routes/user.routes.js");
const productRoute = require("./routes/product.routes.js");

dotenv.config();
const MONGO_URI = process.env.MONGO_URI;

//middlewares
const app = express();
app.use(express.json());

//routes
// app.use("/api/users", userRoute);
app.use("/api/products", productRoute);
mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log("db connected successfully");
    app.listen(3000, () => {
      console.log("server is listining on port 3000");
    });
  })
  .catch((err) => {
    console.log(err);
  });
