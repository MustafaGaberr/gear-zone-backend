const httpstatustext=require("../Utilities/httpstatustext")
const User=require("../models/user.model")
const bcrypt=require("bcrypt")
const jwt =require("jsonwebtoken")
const sendEmail=require("../Utilities/sendEmail")

let Register=async(req,res)=>{
   try{
        const {name,email,password,role,phone}=req.body;
        if(!name || !email || !password || !phone){
            return res.status(400).json({status:httpstatustext.FAIL,message:'name , email , possward and phone are required'})
        }
        const existEmail=await User.findOne({ email })
        if(existEmail){
            return res.status(409).json({status:httpstatustext.FAIL,message:'this email is already exist'})
        }
        const hashedpassworad=await bcrypt.hash(password,10)
        // console.log("Password received:", req.body.password);

        const newUser=await User.create({
            name,
            email,
            password:hashedpassworad,
            phone,
            role: role||'buyer',
        })
        const token= await jwt.sign({ email: newUser.email, id: newUser._id, role: newUser.role }, process.env.SECRET_KEY, { expiresIn: "1d" })
        newUser.token=token;

        return res.status(201).json({status:httpstatustext.SUCCESS,data:{user:newUser}})

   }catch(e){
        return res.status(500).json({status:httpstatustext.ERROR,message: e.message})
   }
}
let Login=async(req,res)=>{
     const {email,password}=req.body
    if(!email || !password){
        return res.status(400).json({status:httpstatustext.FAIL,data:{msg:"email and password is required"}})
    }
    const user =await User.findOne({email})
    if(!user){
        return res.status(404).json({status:httpstatustext.FAIL,data:{user:"this user is not found"}})
    }
     const token=await jwt.sign({email:user.email,id:user._id,role:user.role},process.env.SECRET_KEY,{ expiresIn: '1d'})
     user.token=token
    const matchedPassworad=await bcrypt.compare(password,user.password)
    if(user && matchedPassworad){
        return res.status(200).json({status:httpstatustext.SUCCESS,data:{user:token}})
    }else{
        return res.status(401).json({status:httpstatustext.FAIL,data:null})
    }

}
let getALluser=async(req,res)=>{
    const query=req.query
    const limit=query.limit ;
    const page=query.page || 1
    const skip=(page-1)*limit
    try{
        const getAlluser=await User.find({},{"__v":false,"password":false}).limit(limit).skip(skip);
        return res.status(200).json({status:httpstatustext.SUCCESS,data:{Users:getAlluser}})
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
    const loggedInUser = req.body;

    if (loggedInUser.role === "buyer" && loggedInUser.id !== targetUserId) {
      return res.status(403).json({
        message: "You are not allowed to update another buyer",
      });
    }

   
    let allowedFields = [];

    if (loggedInUser.role === "admin") {
      allowedFields = ["name", "email", "phone", "role", "isActive", "password"];
    } else {
      allowedFields = ["name", "email", "phone", "password"];
    }

    const updates = {};

    Object.keys(req.body).forEach((field) => {
      if (allowedFields.includes(field)) {
        updates[field] = req.body[field];
      }
    });

  
    if (updates.password) {
      const user = await User.findById(targetUserId);

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const hashedPassword = await bcrypt.hash(updates.password, 10);

      updates.password = hashedPassword;

      Object.assign(user, updates);
      await user.save();

      user.password = undefined;  

      return res.status(200).json({
        message: "User updated successfully (password updated)",
        user,
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
      return res.status(404).json({ message: "User not found" });
    }

    updatedUser.password = undefined; 

    return res.status(200).json({
      message: "User updated successfully",
      user: updatedUser,
    });

  } catch (error) {
    return res.status(500).json({
      message: error.message,
    });
  }
};

let deleteUser=async(req,res)=>{
  try{
      const getUserId = req.params.id;       
      
       
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

const forgotPassword=async(req,res)=>{
try {
    const user = await User.findOne({ email: req.body.email });

    if (!user) {
      return res
        .status(404)
        .json({ status: httpstatustext.FAIL, message: "This User is Not Found" });
    }

    // Generate Reset Code
    const resetCode = Math.floor(100000 + Math.random() * 900000).toString();

    // Hash the Code
    const hashedCode = await bcrypt.hash(resetCode, 10);

    // Save to DB
    user.passwordResetCode = hashedCode;
    user.passwordResetExpired = Date.now() + 5 * 60 * 1000; // 5 minutes
    user.passwordVerified = false;

    await user.save(); // IMPORTANT!

  
    await sendEmail({
      email: user.email,     // الإيميل من الداتا بيز
      name: user.name,       // الاسم من الداتا بيز
      resetCode: resetCode,  // الكود اللي اتولد
      subject: 'Your password reset code (valid for 5 minutes)'
    });
    return res.status(200).json({
    status: httpstatustext.SUCCESS,
    message: "Reset code sent to email",
  });

  } catch (err) {
    return res
      .status(500)
      .json({ status: httpstatustext.ERROR, message: err.message });
  }
}

const verifyPasswordResetCode = async (req, res) => {
  try {
    const user = await User.findOne({
      passwordResetExpired: { $gt: Date.now() } // الكود لسه صالح
    });

    if (!user) {
      return res.status(404).json({ status: httpstatustext.FAIL, message: "Reset Code Invalid or Expired" });
    }

    const isValidCode = await bcrypt.compare(req.body.resetCode, user.passwordResetCode);

    if (!isValidCode) {
      return res.status(400).json({ status: httpstatustext.FAIL, message: "Reset Code Invalid or Expired" });
    }

    user.passwordVerified = true;
    await user.save();

    return res.status(200).json({ status: httpstatustext.SUCCESS, message: "Code verified successfully" });
  } catch (err) {
    return res.status(500).json({ status: httpstatustext.ERROR, message: err.message });
  }
};

const restPassword=async(req,res)=>{
  const user= await User.findOne({email:req.body.email})

  if(!user){
    return res.status(404).json({status:httpstatustext.FAIL,message:`this user ${user.email} is not found`})
  }

  if(!user.passwordVerified){
    return res.status(400).json({status:httpstatustext.FAIL,message:"Reset code is not verified"})
  }

  
  user.password = await bcrypt.hash(req.body.newPassword, 10);
  user.passwordResetCode=undefined
  user.passwordVerified=undefined
  user.passwordResetExpired=undefined

  await user.save()

  const token= await jwt.sign({ email: user.email, id: user._id, role: user.role }, process.env.SECRET_KEY, { expiresIn: "1d" })
  res.status(200).json({token})
 
  
}


module.exports={Register, Login,getALluser,updateUser,deleteUser,forgotPassword,verifyPasswordResetCode,restPassword}
