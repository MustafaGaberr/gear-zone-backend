const express = require("express")
// console.log(typeof express)
const app = express()
const mongoose = require("mongoose")
const dotenv = require("dotenv")
dotenv.config()
const MONGO_URI = process.env.MONGO_URI
app.use(express.json())
const userRoute = require("./routes/user.js")
app.use("/user", userRoute)
const productRoute = require("./routes/product.js")
app.use("/product", productRoute)




mongoose.connect(MONGO_URI).then(() => {
    console.log("db connected successfully");

}).catch((err) => {
    console.log(err);

})

app.listen(3000, () => {
    console.log("server is listining on port 3000");

})