import jwt from "jsonwebtoken"
import {registerUserService, 
        getUserByIdService, 
        verifyOtpService,
        resendOtpService,
        sendOtp} 
         from "../services/user.service.js";

const JWT_KEY = process.env.JWT_SECRET;

export const registerUserController = async (req, res) => {
    try {
      const user = req.body;
      const newUser = await registerUserService(user);
      res.status(201).json({status: true, message: "OTP send" ,data:newUser});
    } catch (error) {
      res.status(400).json({ status: false, message:error.message , data: {} });
    }
  };
  
  export const sendOtpController = async (req, res) => {
    try {
        const { mobileNumber } = req.body; 
        const user = await sendOtp(mobileNumber);
      res.status(200).json({ status:true , message: "Otp Sent", data:user });

    } catch (error) {
      res.status(401).json({ status: false, message:error.message , data:{}});
    }
  };
  
  export const getUserByIdController = async (req, res) => {
    try {
      const { userId } = req.params;
      const user = await getUserByIdService(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.status(200).json({ user });
    } catch (error) {
      return res.status(500).json({
        status: false, message:error.message , data: {}
      });
    }
  };

  export const verifyOtpController = async (req, res) => {
    const { mobileNumber, orderId, otp, firstName, lastName } = req.body;

    try {
        // Validate input
        if (!mobileNumber || !orderId || !otp ) {
            return res.status(400).json({
                status: false,
                message: "All fields are required",
                data:{},
            });
        }
        // Call the service function
        const user = await verifyOtpService(mobileNumber, orderId, otp);
        // Generate JWT token
        if(user){
        const token = jwt.sign(
            {
                userId: user._id,  
                email: user.email, 
            },
            JWT_KEY || "54fdsacas892ndsac8",
            // { expiresIn: '1h' } 
        );

        // Respond with the user data and token
        return res.status(200).json({ status: true, message: "OTP verification successful",
            data: { token: token, user: user },
        });}

        return res.status(400).json({status: false, message:"Invalid Validation", data:{}})
    } catch (error) {
        
        return res.status(500).json({
          status: false, message:error.message , data: {}
        });
    }
};

export const resendOtpController = async(req,res) =>{
  try{ 
    const {orderId} = req.body;
    const response = await resendOtpService(orderId);
    if(response){
      return res.status(200).json({status:true, message: "OTP resent on your number", data:response});
    }
    else{
      return res.status(400).json({status: false, message:"Cannot resend OTP" , data:{}})
    }
  }catch(error){
    return res.status(500).json({
      status: false, message:"Cannot send OTP" , data: {}
    });
  }
}