const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");
const userRoute = require("./routes/user.routes.js");
const productRoute = require("./routes/product.routes.js");

dotenv.config();
const MONGO_URI = process.env.MONGO_URI;


//middlewares
const app = express();
app.use(express.json());
app.use(cors());

//routes
// app.use("/api/users", userRoute);
app.use("/api/products", productRoute);
mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log("db connected successfully");
    app.listen(process.env.PORT || 3000, () => {
      console.log(`server is listening on port ${process.env.PORT}`);
    });
  })
  .catch((err) => {
    console.log(err);
  });
