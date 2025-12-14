const httpstatustext=require("../Utilities/httpstatustext")
const User=require("../models/user.model")
const bcrypt=require("bcrypt")
const jwt =require("jsonwebtoken")
const crypto = require("crypto")
const sendEmail=require("../Utilities/sendEmail")

let Register=async(req,res)=>{
   try{
        const {firstName,lastName,userName,email,password,role,phone}=req.body;
        if(!firstName || !lastName || !userName || !email || !password){
            return res.status(400).json({status:httpstatustext.FAIL,message:'firstName, lastName, userName, email and password are required'})
        }
        const existEmail=await User.findOne({ email })
        if(existEmail){
            return res.status(409).json({status:httpstatustext.FAIL,message:'this email is already exist'})
        }
        const existUserName=await User.findOne({ userName })
        if(existUserName){
            return res.status(409).json({status:httpstatustext.FAIL,message:'this username is already taken'})
        }
        const hashedpassworad=await bcrypt.hash(password,10)
        // console.log("Password received:", req.body.password);

        const newUser=await User.create({
            firstName,
            lastName,
            userName,
            email,
            password:hashedpassworad,
            phone,
            role: role||'buyer',
        })
        const token= await jwt.sign({ email: newUser.email, id: newUser._id, role: newUser.role }, process.env.JWT_SECRET, { expiresIn: "1d" })
        newUser.token=token;

        return res.status(201).json({status:httpstatustext.SUCCESS,data:{user:{
          id:newUser._id,
          firstName:newUser.firstName,
          lastName:newUser.lastName,
          userName:newUser.userName,
          email:newUser.email,
          phone:newUser.phone,
          role:newUser.role,
          token:newUser.token
        }}})

   }catch(e){
        return res.status(500).json({status:httpstatustext.ERROR,message: e.message})
   }
}
let Login=async(req,res)=>{
    try {
        console.log("Login req.body:", req.body); // Debug log
        const {email,password} = req.body || {};
        if(!email || !password){
            return res.status(400).json({status:httpstatustext.FAIL,data:{msg:"email and password is required"}})
        }
        const user = await User.findOne({email})

        if(!user){
            return res.status(404).json({status:httpstatustext.FAIL,data:{user:"this user is not found"}})
        }

        if (!user.isActive) {
            return res.status(403).json({ status:httpstatustext.FAIL,data:{message: "Account is deactivated"} });
        }

        const matchedPassworad = await bcrypt.compare(password, user.password)
        if(!matchedPassworad){
            return res.status(401).json({status:httpstatustext.FAIL,data:null})
        }

        const token = await jwt.sign({email:user.email, id:user._id, role:user.role}, process.env.JWT_SECRET, { expiresIn: '1d'})
        user.token = token

        return res.status(200).json({status:httpstatustext.SUCCESS,data:{token}})
    } catch(e) {
        return res.status(500).json({status:httpstatustext.ERROR,message: e.message})
    }
}
let getALluser=async(req,res)=>{
    const query=req.query
    const limit=query.limit ;
    const page=query.page || 1
    const skip=(page-1)*limit
    try{
        const getAlluser=await User.find({},{"__v":false,"password":false}).limit(limit).skip(skip);
        return res.status(200).json({status:httpstatustext.SUCCESS,data:{Users:{
          id:getAlluser._id,
          firstName:getAlluser.firstName,
          lastName:getAlluser.lastName,
          userName:getAlluser.userName,
          email:getAlluser.email,
          phone:getAlluser.phone,
          role:getAlluser.role,
          token:getAlluser.token
        }}})
    }catch(e){
      return res.status(500).json({
      status: httpstatustext.ERROR,
      message: e.message
    });
    }
}
let updateUser = async (req, res) => {
  try {
    const targetUserId = req.params.id;
    const { currentPassword, newPassword, confirmPassword } = req.body;

    // Check if user is trying to change password
    if (currentPassword || newPassword || confirmPassword) {
      // All password fields are required
      if (!currentPassword || !newPassword || !confirmPassword) {
        return res.status(400).json({
          status: httpstatustext.FAIL,
          message: "currentPassword, newPassword and confirmPassword are all required"
        });
      }

      // Check if new passwords match
      if (newPassword !== confirmPassword) {
        return res.status(400).json({
          status: httpstatustext.FAIL,
          message: "New password and confirm password do not match"
        });
      }

      const user = await User.findById(targetUserId);

      if (!user) {
        return res.status(404).json({
          status: httpstatustext.FAIL,
          message: "User not found"
        });
      }

      // Verify current password
      const isPasswordCorrect = await bcrypt.compare(currentPassword, user.password);

      if (!isPasswordCorrect) {
        return res.status(401).json({
          status: httpstatustext.FAIL,
          message: "Current password is incorrect"
        });
      }

      // Hash and save new password
      user.password = await bcrypt.hash(newPassword, 10);
      user.passwordChangedAt = Date.now();

      // Also update other fields if provided
      const allowedFields = ["firstName", "lastName", "userName", "email", "phone"];
      allowedFields.forEach((field) => {
        if (req.body[field]) {
          user[field] = req.body[field];
        }
      });

      await user.save();

      user.password = undefined;

      return res.status(200).json({
        status: httpstatustext.SUCCESS,
        message: "User updated successfully",
        user,
      });
    }

    // Regular update (no password change)
    const allowedFields = ["firstName", "lastName", "userName", "email", "phone"];

    const updates = {};

    Object.keys(req.body).forEach((field) => {
      if (allowedFields.includes(field)) {
        updates[field] = req.body[field];
      }
    });

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        status: httpstatustext.FAIL,
        message: "No valid fields to update"
      });
    }

    const updatedUser = await User.findByIdAndUpdate(
      targetUserId,
      updates,
      {
        new: true,
        runValidators: true,
      }
    );

    if (!updatedUser) {
      return res.status(404).json({
        status: httpstatustext.FAIL,
        message: "User not found"
      });
    }

    updatedUser.password = undefined;

    return res.status(200).json({
      status: httpstatustext.SUCCESS,
      message: "User updated successfully",
      user: updatedUser,
    });

  } catch (error) {
    return res.status(500).json({
      status: httpstatustext.ERROR,
      message: error.message,
    });
  }
};

let deleteUser=async(req,res)=>{
  try{
      const getUserId = req.params.id;       
    //   const loggedUser = req.user;
    //   if (loggedUser.role !== "admin" && loggedUser.id !== getUserId) {
    //   return res.status(403).json({status:httpstatustext.FAIL ,message: "You are not allowed to delete other users" });
    // }
     
      const user = await User.findById(getUserId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      await User.findByIdAndDelete(getUserId);
      return res.status(200).json({ message: "User deleted successfully" });

  } catch (err) {
    return res.status(500).json({ message: "Server error", error: err.message });
  }
}

const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body || {};

    if (!email) {
      return res.status(400).json({ status: httpstatustext.FAIL, message: "Email is required" });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ status: httpstatustext.FAIL, message: "This User is Not Found" });
    }

    // Generate 6-digit Reset Code
    const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Hash with SHA256 (searchable in DB)
    const hashedCode = crypto.createHash('sha256').update(resetCode).digest('hex');

    // Save to DB - expires in 15 minutes
    user.passwordResetCode = hashedCode;
    user.passwordResetExpired = Date.now() + 15 * 60 * 1000; // 15 minutes
    user.passwordResetToken = undefined;
    user.passwordResetTokenExpired = undefined;

    await user.save();

    // Send email
    await sendEmail({
      email: user.email,
      userName: user.userName,
      resetCode: resetCode,
      subject: 'Your password reset code (valid for 15 minutes)'
    });

    return res.status(200).json({
      status: httpstatustext.SUCCESS,
      message: "Reset code sent to email"
    });

  } catch (err) {
    return res.status(500).json({ status: httpstatustext.ERROR, message: err.message });
  }
}

const verifyPasswordResetCode = async (req, res) => {
  try {
    const { resetCode } = req.body || {};

    if (!resetCode) {
      return res.status(400).json({ status: httpstatustext.FAIL, message: "Reset code is required" });
    }

    // Hash the reset code to search in DB
    const hashedCode = crypto.createHash('sha256').update(resetCode).digest('hex');

    // Find user by reset code hash with valid expiry
    const user = await User.findOne({
      passwordResetCode: hashedCode,
      passwordResetExpired: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(404).json({ status: httpstatustext.FAIL, message: "Reset Code Invalid or Expired" });
    }

    // Generate a temporary reset token for password reset
    const resetToken = crypto.randomBytes(32).toString('hex');
    const hashedResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');

    // Save the hashed token and set expiry (15 minutes)
    user.passwordResetToken = hashedResetToken;
    user.passwordResetTokenExpired = Date.now() + 15 * 60 * 1000;
    user.passwordResetCode = undefined;
    user.passwordResetExpired = undefined;

    await user.save();

    return res.status(200).json({ 
      status: httpstatustext.SUCCESS, 
      message: "Code verified successfully",
      resetToken: resetToken
    });
  } catch (err) {
    return res.status(500).json({ status: httpstatustext.ERROR, message: err.message });
  }
};

const resetPassword = async (req, res) => {
  try {
    const { resetToken, newPassword } = req.body || {};

    if (!resetToken || !newPassword) {
      return res.status(400).json({ status: httpstatustext.FAIL, message: "Reset token and new password are required" });
    }

    // Hash the token to compare with stored hash
    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

    // Find user by token and check if not expired
    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetTokenExpired: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ status: httpstatustext.FAIL, message: "Reset token is invalid or expired" });
    }

    // Update password
    user.password = await bcrypt.hash(newPassword, 10);
    user.passwordResetToken = undefined;
    user.passwordResetTokenExpired = undefined;
    user.passwordChangedAt = Date.now();

    await user.save();

    // Generate new auth token
    const token = await jwt.sign(
      { email: user.email, id: user._id, role: user.role }, 
      process.env.JWT_SECRET, 
      { expiresIn: "1d" }
    );

    return res.status(200).json({ 
      status: httpstatustext.SUCCESS, 
      message: "Password reset successfully",
      token 
    });
  } catch (err) {
    return res.status(500).json({ status: httpstatustext.ERROR, message: err.message });
  }
}



const deactivateAccount=async(req,res)=>{
  try{
      const loggedUser=req.user;
      console.log(loggedUser);

      const user= await User.findById(loggedUser.id);
      if(!user){
        return res.status(404).json({status:httpstatustext.FAIL,message:"User not found"})
      }
      user.isActive=false;
      await user.save();
      return res.status(200).json({status:httpstatustext.SUCCESS,message:"Account deactivated successfully"})
  }catch(e){
    return res.status(500).json({status:httpstatustext.ERROR,message: e.message})
  }
}
const ActiveAccount=async(req,res)=>{
  try{
      const loggedUser=req.user;
      console.log(loggedUser);
      const user= await User.findById(loggedUser.id);
      if(!user){
        return res.status(404).json({status:httpstatustext.FAIL,message:"User not found"})
      }
      user.isActive=true;
      await user.save();
      return res.status(200).json({status:httpstatustext.SUCCESS,message:"Account activated successfully"})
  }catch(e){
    return res.status(500).json({status:httpstatustext.ERROR,message: e.message})
  }

}



module.exports={Register, Login,getALluser,updateUser,deleteUser,forgotPassword,verifyPasswordResetCode,resetPassword,deactivateAccount,ActiveAccount}
