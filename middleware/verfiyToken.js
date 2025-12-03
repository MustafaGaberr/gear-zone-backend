
const httpstatustext=require("../Utilities/httpstatustext")
const jwt=require("jsonwebtoken")

const verfiytoken=async(req,res,next)=>{
    const authHeader=req.headers.authorization|| req.headers.Authorization

    if(!authHeader){
        return res.status(401).json({status:httpstatustext.FAIL,message:"Token is Required"})
    }

    const token=authHeader.split(" ")[1]

   try{
         const decoded=jwt.verify(token,process.env.SECRET_KEY)
        req.decoded=decoded
        console.log("decoded:",decoded);
   }catch(err){
      return  res.status(401).json({msg:"unauthrized",err})
    }
next()
}

module.exports=verfiytoken