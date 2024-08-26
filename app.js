import express from 'express';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import dotenv from 'dotenv';
import connectDB from './constants/db.js';  

dotenv.config();

import userRouter from './routes/user.route.js';
import cabRoutes from './routes/cab.routes.js';
import driverRouter from './routes/driver.routes.js';

const app = express();
const port = process.env.PORT || 3000;

// Connect to MongoDB
connectDB();

app.use(express.json());

const server = http.createServer(app);
const io = new SocketIOServer(server);

//setting io instance for req.app
app.set('io',io);

// Root Route
app.use('/', (req, res, next) => {
  if (req.path === '/') {
    return res.json({ message: "Welcome to cab booking application's backend" });
  }
  next();
});

app.use('/user', userRouter);
app.use('/cab', cabRoutes);
app.use('/driver',driverRouter);

server.listen(port, '0.0.0.0', () => {
  console.log(`Server is running on port ${port}`);
});

// Socket.IO connection handling
io.on('connection', (socket) => {  
  console.log('New client connected');

  // Example event handler
  socket.on('ride-request', (data) => {
    console.log('Received ride-request with data:', data);
    socket.emit('responseEvent', { message: 'Data received' });
  });

  socket.on('message', (data) => {
    console.log('Received message with data:', data);
    socket.emit('responseEvent', { message: 'Data received' });
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });
});
