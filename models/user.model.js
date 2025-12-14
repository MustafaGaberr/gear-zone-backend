const mongoose = require("mongoose");
const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z]).{8,}$/;

const userSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: [true, "First name is required"],
    minlength: [2, "First name must be at least 2 characters"],
    maxlength: [30, "First name must be less than 30 characters"],
    trim: true
  },

  lastName: {
    type: String,
    required: [true, "Last name is required"],
    minlength: [2, "Last name must be at least 2 characters"],
    maxlength: [30, "Last name must be less than 30 characters"],
    trim: true
  },

  userName: {
    type: String,
    required: [true, "Username is required"],
    unique: true,
    minlength: [3, "Username must be at least 3 characters"],
    maxlength: [20, "Username must be less than 20 characters"],
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

  phone: {
    type: String,
    trim: true
  },

  password: {
    type: String,
    required: [true, "Password is required"],
    minlength: [8, "Password must be at least 8 characters"],
    validate: {
      validator: function (value) {
        // At least 1 uppercase, 1 lowercase, 1 digit, 1 special character
        return passwordRegex.test(value);
      },
      message:
        "Password must contain at least 1 uppercase and 1 lowercase character and must be at least 8 characters",
    },
  },

  passwordChangedAt: {
    type: Date
  },
  passwordResetCode: {
    type: String
  },
  passwordResetExpired: {
    type: Date
  },
  passwordResetToken: {
    type: String
  },
  passwordResetTokenExpired: {
    type: Date
  },
  role: {
    type: String,
    enum: ["admin", "seller", "buyer"],
    default: "buyer"
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
