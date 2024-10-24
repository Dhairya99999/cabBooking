import express from 'express';
import {
  registerUserController,
  getUserByIdController,
  verifyOtpController,
  resendOtpController,
  sendOtpController,
  getAllUsersController
} from '../controllers/user.controller.js';

const userRouter = express.Router();

userRouter.post('/signup', registerUserController);
userRouter.post('/login', sendOtpController);
userRouter.get('/:userId', getUserByIdController);
userRouter.post('/verify_otp', verifyOtpController);
userRouter.post('/resend_otp', resendOtpController);
userRouter.get('/all/users', getAllUsersController);

export default userRouter;