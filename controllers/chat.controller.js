const Message = require("../models/message.model");
const { getIO } = require("../Utilities/socket"); 
const mongoose = require('mongoose');
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
//get all user's chat messages
const getUserConversations = async (req, res) => {
  try {
    console.log("getUserConversations called");
    
    const userId = req.params.userId || req.query.myId; 

    if (!userId) return res.status(400).json({ error: "User ID is required" });

    const conversations = await Message.aggregate([
      {
        $match: {
          $or: [
            { sender: new mongoose.Types.ObjectId(userId) },
            { recipient: new mongoose.Types.ObjectId(userId) },
          ],
        },
      },
      {
        $sort: { createdAt: -1 },
      },
      {
        $group: {
          _id: {
            $cond: {
              if: { $eq: ["$sender", new mongoose.Types.ObjectId(userId)] },
              then: "$recipient",  
              else: "$sender",          
            },
          },
          lastMessageDoc: { $first: "$$ROOT" }, 
        },
      },
      {
        $lookup: {
          from: "users",  
          localField: "_id",
          foreignField: "_id",
          as: "userDetails",
        },
      },
      {
        $unwind: "$userDetails", 
      },
      {
        $project: {
          _id: "$userDetails._id",
          name: "$userDetails.name",
          email: "$userDetails.email",
          lastMessage: { 
            $ifNull: ["$lastMessageDoc.contentMes", "$lastMessageDoc.content"] 
          },
          timestamp: "$lastMessageDoc.createdAt",
        },
      },
      {
        $sort: { timestamp: -1 }, 
      },
    ]);

    res.status(200).json({
      status: "success",
      count: conversations.length,
      data: conversations,
    });
  } catch (err) {
    console.error(err);
    res.status(400).json({ status: "error", error: err.message });
  }
};

module.exports = { getChatHistory, sendMessage, getUserConversations };