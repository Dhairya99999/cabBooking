import axios from "axios";
import {UserModel} from "../models/user.model.js"
import { comparePassword, hashPassword } from "../utils/passwordManager.js";


export const registerUserService = async (user) => {
    try {
      const existingUser = await UserModel.findOne({
        $or: [{ email: user.email }, { mobileNumber: user.mobileNumber }],
      });
      if (existingUser) {
        throw new Error("Existing user. Please log in");
      }
      const newUser = new UserModel(user);
     

      const response = await axios.post(
        "https://auth.otpless.app/auth/otp/v1/send",
        {
          phoneNumber: `91${user.mobileNumber}`,
          otpLength: 6,
          channel: "SMS",
          expiry: 600,
        },
        {
          headers: {
            clientId: process.env.CLIENT_ID,
            clientSecret: process.env.CLIENT_SECRET,
            "Content-Type": "application/json",
          },
        });
        await newUser.save();
        return response.data;
        
    } catch (error) {
      throw error;
    }
  };


export const sendOtp = async (mobileNumber) =>{

   try {
     const existingUser = await UserModel.findOne({mobileNumber: mobileNumber})
    if(!existingUser){
        throw new Error("The User does not exists.")
    }
    else{
      const response = await axios.post(
        "https://auth.otpless.app/auth/otp/v1/send",
        {
          phoneNumber: `91${mobileNumber}`,
          otpLength: 6,
          channel: "SMS",
          expiry: 600,
        },
        {
          headers: {
            clientId: process.env.CLIENT_ID,
            clientSecret: process.env.CLIENT_SECRET,
            "Content-Type": "application/json",
          },
        });
        return response.data;
    }
} catch(error){
    console.log(error);
    throw error;
}}


export const getUserByIdService = async (userId)=>{
    try{
        const user = await UserModel.findById(userId);
        if(!user){
            console.log("User Does Not Exists");
        }
        user.password = undefined;
        return user;
    }catch(error){
        console.log(error);
        throw new error;
    }
}


export const verifyOtpService = async (mobileNumber, orderId, otp) => {
  try {
    // Bypass condition
    if (mobileNumber === "9999999999" && otp === "000000") {
      // Bypass verification, no need to call the external service
      // Find user by phone number
      const user = await UserModel.findOne({ mobileNumber: mobileNumber }).select('-createdAt -updatedAt -__v');
      if (user) {
        user.isVerified = true; // Update the user as verified
        await user.save();
        return user;
      } else {
        throw new Error("User not found");
      }
    }

    
    const response = await axios.post(
      "https://auth.otpless.app/auth/otp/v1/verify",
      {
        orderId: orderId,
        phoneNumber: `91${mobileNumber}`,
        otp: otp,
      },
      {
        headers: {
          clientId: process.env.CLIENT_ID,
          clientSecret: process.env.CLIENT_SECRET,
          "Content-Type": "application/json",
        },
      }
    );

    console.log('OTP verification API response:', response.data);

    if (response.data.isOTPVerified) {
      // Find user by phone number
      const user = await UserModel.findOne({ mobileNumber: mobileNumber }).select('-createdAt -updatedAt -__v');
      if (user) {
        user.isVerified = true; // Update the user as verified
        await user.save();
        return user;
      } else {
        throw new Error("User not found");
      }
    } else {
      throw new Error("OTP verification failed");
    }
  } catch (error) {
    console.error("Error during OTP verification:", error.response ? error.response.data : error.message);
    throw error;
  }
};

export const resendOtpService = async(orderId)=>{
  try {
    const response = await axios.post(
      "https://auth.otpless.app/auth/otp/v1/resend",
      {
        orderId: orderId,
      },
      {
        headers: {
          clientId: process.env.CLIENT_ID,
          clientSecret: process.env.CLIENT_SECRET,
          "Content-Type": "application/json",
        },
      }
    );
    return response.data;
  } catch (err) {
    console.log(err.message);
    throw err;
  }
}