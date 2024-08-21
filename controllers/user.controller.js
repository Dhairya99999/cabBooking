import jwt from "jsonwebtoken"
import {registerUserService, 
        getUserByIdService, 
        verifyOtpService,
        resendOtpService,
        sendOtp} 
         from "../services/user.service.js";

const JWT_KEY = process.env.JWT_KEY || "54fdsacas892ndsac8";

export const registerUserController = async (req, res) => {
    try {
      const user = req.body;
      const newUser = await registerUserService(user);
      res.status(201).json({status: true, message: "OTP send" ,data:newUser});
    } catch (error) {
      console.error("Registration error:", error);
      res.status(400).json({ error: error.message });
    }
  };
  
  export const sendOtpController = async (req, res) => {
    try {
        const { mobileNumber } = req.body; 
        const user = await sendOtp(mobileNumber);
      res.status(200).json({ status:true , message: "Otp Sent", data:user });

    } catch (error) {
      console.error("Login error:", error);
      res.status(401).json({ error: error.message });
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
      console.error("Get user by ID error:", error);
      res.status(500).json({ error: error.message });
    }
  };

  export const verifyOtpController = async (req, res) => {
    const { mobileNumber, orderId, otp, firstName, lastName } = req.body;

    try {
        // Validate input
        if (!mobileNumber || !orderId || !otp || !firstName || !lastName) {
            return res.status(400).json({
                status: false,
                message: "All fields are required",
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
            JWT_KEY,
            { expiresIn: '1h' } 
        );

        // Respond with the user data and token
        return res.status(200).json({ status: true, message: "OTP verification successful",
            data: { token: token, user: user },
        });}

        return res.status(400).json({message:"Invalid validation"})
    } catch (error) {
        console.error("OTP verification error:", error.message);
        return res.status(500).json({
            status: false,
            message: error.message || "An error occurred during OTP verification",
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
      return res.status(400).json({message:"Cannot resend OTP"})
    }
  }catch(error){
    console.log(error);
    throw error;
  }
}