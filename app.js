import dotenv from "dotenv";
import express from "express";
import userRouter from "./routes/user.route.js";
import connectDB from "./constants/db.js";

dotenv.config();

const app = express();
const port= 3000;
app.use(express.json());


//ROUTES
app.use('/user', userRouter);


connectDB();
app.listen(port,()=>{
    console.log(`Server is running on the port ${port}`)
})