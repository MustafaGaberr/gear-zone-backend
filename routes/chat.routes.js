const express = require("express");
const router = express.Router();
const { sendMessage, getChatHistory, getUserConversations } = require("../controllers/chat.controller");
const authMiddleware = require("../middleware/verfiyToken"); 

// router.get("/history/:friendId", authMiddleware, getChatHistory);
router.get("/history/:friendId", getChatHistory);
router.get("/conversations/:userId", getUserConversations);

// router.post("/send", authMiddleware, sendMessage);
router.post("/send", sendMessage);



module.exports = router;