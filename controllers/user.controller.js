const httpstatustext=require("../Utilities/httpstatustext")
const User=require("../models/user.model")
const bcrypt=require("bcrypt")
const jwt =require("jsonwebtoken")
const crypto = require("crypto")
const sendEmail=require("../Utilities/sendEmail")

// Helper function to create error with status
const createError = (message, status = 500) => {
  const error = new Error(message);
  error.status = status;
  return error;
};

let Register=async(req,res,next)=>{
   try{
        const {firstName,lastName,userName,email,password,role,phone}=req.body;
        if(!firstName || !lastName || !userName || !email || !password){
            return next(createError('firstName, lastName, userName, email and password are required', 400))
        }
       
        if (role && !['buyer', 'seller'].includes(role)) {
          return next(createError('Role must be buyer or seller only', 400));
        }
        const existEmail=await User.findOne({ email })
        if(existEmail){
            return next(createError('this email is already exist', 409))
        }
        const existUserName=await User.findOne({ userName })
        if(existUserName){
            return next(createError('this username is already taken', 409))
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
        next(e)
   }
}
let Login=async(req,res,next)=>{
    try {
        console.log("Login req.body:", req.body); // Debug log
        const {email,password} = req.body || {};
        if(!email || !password){
            return next(createError("email and password is required", 400))
        }
        const user = await User.findOne({email})

        if(!user){
            return next(createError("this user is not found", 404))
        }

        if (!user.isActive) {
            return next(createError("Account is deactivated", 403));
        }

        const matchedPassworad = await bcrypt.compare(password, user.password)
        if(!matchedPassworad){
            return next(createError("Invalid credentials", 401))
        }

        const token = await jwt.sign({email:user.email, id:user._id, role:user.role}, process.env.JWT_SECRET, { expiresIn: '1d'})
        user.token = token

        return res.status(200).json({status:httpstatustext.SUCCESS,data:{token}})
    } catch(e) {
        next(e)
    }
}
let getALluser=async(req,res,next)=>{
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
      next(e)
    }
}
let updateUser = async (req, res, next) => {
  try {
    const targetUserId = req.params.id;
    const { currentPassword, newPassword, confirmPassword } = req.body;

    // Check if user is trying to change password
    if (currentPassword || newPassword || confirmPassword) {
      // All password fields are required
      if (!currentPassword || !newPassword || !confirmPassword) {
        return next(createError("currentPassword, newPassword and confirmPassword are all required", 400));
      }

      // Check if new passwords match
      if (newPassword !== confirmPassword) {
        return next(createError("New password and confirm password do not match", 400));
      }

      const user = await User.findById(targetUserId);

      if (!user) {
        return next(createError("User not found", 404));
      }

      // Verify current password
      const isPasswordCorrect = await bcrypt.compare(currentPassword, user.password);

      if (!isPasswordCorrect) {
        return next(createError("Current password is incorrect", 401));
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
      return next(createError("No valid fields to update", 400));
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
      return next(createError("User not found", 404));
    }

    updatedUser.password = undefined;

    return res.status(200).json({
      status: httpstatustext.SUCCESS,
      message: "User updated successfully",
      user: updatedUser,
    });

  } catch (error) {
    next(error);
  }
};

let deleteUser=async(req,res,next)=>{
  try{
      const getUserId = req.params.id;       
    //   const loggedUser = req.user;
    //   if (loggedUser.role !== "admin" && loggedUser.id !== getUserId) {
    //   return next(createError("You are not allowed to delete other users", 403));
    // }
     
      const user = await User.findById(getUserId);
      if (!user) {
        return next(createError("User not found", 404));
      }

      await User.findByIdAndDelete(getUserId);
      return res.status(200).json({ message: "User deleted successfully" });

  } catch (err) {
    next(err);
  }
}

const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body || {};

    if (!email) {
      return next(createError("Email is required", 400));
    }

    const user = await User.findOne({ email });

    if (!user) {
      return next(createError("This User is Not Found", 404));
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
    next(err);
  }
}

const verifyPasswordResetCode = async (req, res, next) => {
  try {
    const { resetCode } = req.body || {};

    if (!resetCode) {
      return next(createError("Reset code is required", 400));
    }

    // Hash the reset code to search in DB
    const hashedCode = crypto.createHash('sha256').update(resetCode).digest('hex');

    // Find user by reset code hash with valid expiry
    const user = await User.findOne({
      passwordResetCode: hashedCode,
      passwordResetExpired: { $gt: Date.now() }
    });

    if (!user) {
      return next(createError("Reset Code Invalid or Expired", 404));
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
    next(err);
  }
};

const resetPassword = async (req, res, next) => {
  try {
    const { resetToken, newPassword } = req.body || {};

    if (!resetToken || !newPassword) {
      return next(createError("Reset token and new password are required", 400));
    }

    // Hash the token to compare with stored hash
    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

    // Find user by token and check if not expired
    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetTokenExpired: { $gt: Date.now() }
    });

    if (!user) {
      return next(createError("Reset token is invalid or expired", 400));
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
    next(err);
  }
}



const deactivateAccount=async(req,res,next)=>{
  try{
      const loggedUser=req.user;
      console.log(loggedUser);

      const user= await User.findById(loggedUser.id);
      if(!user){
        return next(createError("User not found", 404))
      }
      user.isActive=false;
      await user.save();
      return res.status(200).json({status:httpstatustext.SUCCESS,message:"Account deactivated successfully"})
  }catch(e){
    next(e)
  }
}
const ActiveAccount=async(req,res,next)=>{
  try{
      const loggedUser=req.user;
      console.log(loggedUser);
      const user= await User.findById(loggedUser.id);
      if(!user){
        return next(createError("User not found", 404))
      }
      user.isActive=true;
      await user.save();
      return res.status(200).json({status:httpstatustext.SUCCESS,message:"Account activated successfully"})
  }catch(e){
    next(e)
  }

}



module.exports={Register, Login,getALluser,updateUser,deleteUser,forgotPassword,verifyPasswordResetCode,resetPassword,deactivateAccount,ActiveAccount}
