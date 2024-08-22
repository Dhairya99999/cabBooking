import express from 'express';
import http from 'http';
import { WebSocketServer } from 'ws';
import dotenv from "dotenv";
import connectDB from "./constants/db.js";  

dotenv.config();

import userRouter from './routes/user.route.js';
import rideRoutes from './routes/cab.routes.js'; 
import cabRoutes from './routes/cab.routes.js'
import bookingRoutes from "./routes/bookings.routes.js"


const app = express();
const port = process.env.PORT || 3000;

// Connect to MongoDB
connectDB();


app.use(express.json());

const server = http.createServer(app);
const wss = new WebSocketServer({ server });


// Root Route
app.use('/', (req, res, next) => {
  if (req.path === '/') {
    return res.json({ message: "Welcome to cab booking application's backend" });
  }
  next();
});

app.use('/user', userRouter);
app.use('/cab', bookingRoutes);
app.use('/rides', rideRoutes); 
app.use('/cab', cabRoutes);

server.listen(port,'0.0.0.0', () => {
  console.log(`Server is running on port ${port}`);
});

// WebSocket connection handling
wss.on('connection', (ws) => {
  console.log('New client connected');

  ws.on('close', () => {
    console.log('Client disconnected');
  });
});
