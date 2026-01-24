const Message = require("../models/message.model");
const { getIO } = require("../Utilities/socket"); 
const mongoose = require('mongoose');

const sendMessage = async (req, res, next) => {
  try {
    const { recipientId, content } = req.body;
    
    if (!recipientId || !content) {
      return res.status(400).json({ 
        status: "error", 
        message: "recipientId and content are required" 
      });
    }

    // Use authenticated user ID from JWT token
    const senderId = req.user.id || req.user._id;
    
    if (!senderId) {
      return res.status(401).json({ 
        status: "error", 
        message: "User not authenticated" 
      });
    }

    const newMessage = await Message.create({
      sender: senderId,
      recipient: recipientId,
      contentMes: content,
    });

    // Emit message to recipient via Socket.IO
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
    next(err);
  }
};
//get all messages between two users
const getChatHistory = async (req, res, next) => {
  try {
    // Use authenticated user ID from JWT token
    const myId = req.user.id || req.user._id;
    const { friendId } = req.params; 

    if (!myId) {
      return res.status(401).json({ 
        status: "error", 
        message: "User not authenticated" 
      });
    }

    if (!friendId) {
      return res.status(400).json({ 
        status: "error", 
        message: "friendId is required" 
      });
    }

    const messages = await Message.find({
      $or: [
        { sender: myId, recipient: friendId },
        { sender: friendId, recipient: myId },
      ],
    })
    .sort({ createdAt: 1 }); 

    res.status(200).json({
      status: "success",
      count: messages.length,
      data: messages,
    });
  } catch (err) {
    next(err);
  }
};
//get all user's chat messages
const getUserConversations = async (req, res, next) => {
  try {
    // Use authenticated user ID from JWT token
    const userId = req.user.id || req.user._id;

    if (!userId) {
      return res.status(401).json({ 
        status: "error", 
        message: "User not authenticated" 
      });
    }

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
    next(err);
  }
};

module.exports = { getChatHistory, sendMessage, getUserConversations };