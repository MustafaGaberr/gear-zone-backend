const Message = require("../models/message.model");
const { getIO } = require("../Utilities/socket"); 

const sendMessage = async (req, res) => {
  try {
    const { recipientId, content } = req.body;
    // const senderId = req.user._id; 
    //for test
    const senderId = req.body.senderId;
    const newMessage = await Message.create({
      sender: senderId,
      recipient: recipientId,
      contentMes: content,
    });

    getIO().to(recipientId).emit("private_message", {
      contentMes: content,
      senderId: senderId,
      createdAt: newMessage.createdAt
    });

    res.status(201).json({
      status: "success",
      data: newMessage,
    });
  } catch (err) {
    res.status(400).json({ status: "error", error: err.message });
  }
};

//get all messages between two users

const getChatHistory = async (req, res) => {
  try {
    // const myId = req.user._id; 
    const myId = req.query.myId;
    const { friendId } = req.params; 

   
    const messages = await Message.find({
      $or: [
    
        { sender: myId, recipient: friendId },
      
        { sender: friendId, recipient: myId },
      ],
    })
    .sort({ createdAt: 1 }); 
    //  .populate("sender", "name email"); 

    res.status(200).json({
      status: "success",
      count: messages.length,
      data: messages,
    });
  } catch (err) {
    res.status(400).json({ status: "error", error: err.message });
  }
};

module.exports = { getChatHistory, sendMessage };

