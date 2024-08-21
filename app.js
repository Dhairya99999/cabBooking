import dotenv from "dotenv";
import express from "express";
import userRouter from "./routes/user.route.js";
import connectDB from "./constants/db.js";

dotenv.config();

const app = express();
const port= 3000;
app.use(express.json());


//ROUTES
app.use('/', (req, res, next) => {
    if (req.path === '/') {
      return res.json({ message: "Welcome to cab booking application's backend" });
    }
    next();
  });
app.use('/user', userRouter);


connectDB();
app.listen(port,()=>{
    console.log(`Server is running on the port ${port}`)
})