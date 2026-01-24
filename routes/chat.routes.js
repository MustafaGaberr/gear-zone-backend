const express = require("express");
const router = express.Router();
const { sendMessage, getChatHistory, getUserConversations } = require("../controllers/chat.controller");
const authMiddleware = require("../middleware/verfiyToken"); 

// All chat routes require authentication
router.get("/history/:friendId", authMiddleware, getChatHistory);
router.get("/conversations/:userId", authMiddleware, getUserConversations);
router.post("/send", authMiddleware, sendMessage);

module.exports = router;