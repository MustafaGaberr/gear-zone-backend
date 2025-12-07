const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Name is required"],
    minlength: [3, "Name must be at least 3 characters"],
    maxlength: [50, "Name must be less than 50 characters"],
    trim: true
  },

  email: {
    type: String,
    required: [true, "Email is required"],
    unique: true,
    lowercase: true,
    trim: true,
    match: [
      /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
      "Please provide a valid email"
    ]
  },

 password: {
  type: String,
  required: [true, "Password is required"],
  minlength: [6, "Password must be at least 6 characters"],
  validate: {
    validator: function (value) {
      // At least 1 uppercase, 1 lowercase, 1 digit, 1 special character
      return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{6,}$/.test(value);
    },
    message:
      "Password must contain at least 1 uppercase, 1 lowercase, 1 number, and 1 special character",
  },
},
passwordChangedAt:{
  type:Date
},
passwordResetCode:{
  type:String
},
passwordResetExpired:{
  type:Date
},
passwordVerified:{
  type:Boolean
},
role:{
    type: String,
    enum: ["admin", "seller", "buyer"], // roles allowed
    default: "buyer"
  },
  phone:{
     type: String,
  }
  ,
  token:{
    type:String
  },
  isActive: {
    type: Boolean,
    default: true 
  }
});

module.exports = mongoose.model("User", userSchema);
