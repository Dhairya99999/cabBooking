import express from 'express';
import http from 'http';
import { WebSocketServer } from 'ws';
import dotenv from "dotenv";
import connectDB from "./constants/db.js";  // Adjust the path as necessary

dotenv.config();

import userRouter from './routes/user.route.js';
import rideRoutes from './routes/cab.routes.js'; // Make sure this path is correct
import cabRoutes from './routes/cab.routes.js'



const app = express();
const port = process.env.PORT || 3000;

// Connect to MongoDB
connectDB();


app.use(express.json());

const server = http.createServer(app);
const wss = new WebSocketServer({ server });

app.use('/rides', rideRoutes); // This sets the base path for cab routes
app.use('/cab', cabRoutes);

// Root Route
app.use('/', (req, res, next) => {
  if (req.path === '/') {
    return res.json({ message: "Welcome to cab booking application's backend" });
  }
  next();
});

app.use('/user', userRouter);

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
