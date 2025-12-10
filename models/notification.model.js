const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false, 
    },

    message: {
      type: String,
      required: true,
    },

    isRead: {
      type: Boolean,
      default: false,
    },

    type: {
      type: String,
      enum: ["order", "payment", "system", "promotion", "product_new"], 
      default: "system",
    },

    link: {
      type: String,
      required: false,
    },
    
  },
  { timestamps: true } 
);

module.exports = mongoose.model("Notification", notificationSchema);