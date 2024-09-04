import express from 'express';
import http from 'http';
import swaggerUi from 'swagger-ui-express';
import { Server as SocketIOServer } from 'socket.io';
import dotenv from 'dotenv';
import connectDB from './constants/db.js';  
import Driver from './models/driver.model.js';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config();

import userRouter from './routes/user.route.js';
import cabRoutes from './routes/cab.routes.js';

const app = express();
const port = process.env.PORT || 3000;

// Connect to MongoDB
connectDB();

app.use(express.json());
app.use(express.static('public'));

// Dynamically import JSON file with assertions
const swaggerDocument = await import('./public/swagger.json', {
  assert: { type: 'json' }
});

// Serve Swagger API docs
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument.default));

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

server.listen(port, '0.0.0.0', () => {
  console.log(`Server is running on port ${port}`);
});

io.on('connection', (socket) => {  
  console.log('New client connected', socket.id);

  // Handle driver registration
  socket.on('register-driver', async (driver_id) => {
    try {
      // Update driver with socketId
      const driver = await Driver.findOneAndUpdate(
        { _id: driver_id },
        { $set: { socketId: socket.id } },
        { new: true }
      ).populate('on_going_ride_id').exec();
  

     if(driver.on_going_ride_id){
      const ongoingRide = driver.on_going_ride_id;

      io.to(driver.socketId).emit('ride-request', { ride_id: driver.on_going_ride_id._id, ...ongoingRide.toObject() });
     }
     else{
      console.log("No ongoing ride for the registered driver")
     }
      console.log(`Driver ${driver_id} registered with socketId ${socket.id}`);
    } catch (error) {
      console.error('Error registering driver:', error);
    }
  });

  // Example event handlers
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