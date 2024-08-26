import express from "express";
import { createRideRequest, acceptRide, startRide, completeRide, cancelRide } from "../services/ride.service.js";

const router = express.Router();

const rideRoutes = (io) => {
  // Create a ride request
  router.post('/request', async (req, res) => {
    try {
      const { userID, pickupLocation, dropLocation } = req.body;
      const rideRequest = await createRideRequest(io, userID, pickupLocation, dropLocation);
      io.emit('ride-request', rideRequest); // Notify all clients about the new ride request
      res.status(201).json(rideRequest);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Accept a ride request
  router.post('/accept', async (req, res) => {
    try {
      const { driverID, rideID } = req.body;
      const rideRequest = await acceptRide(io, driverID, rideID);
      io.emit('ride-accepted', rideRequest); // Notify all clients about the accepted ride
      res.status(200).json(rideRequest);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Start a ride
  router.post('/start', async (req, res) => {
    try {
      const { driverID, rideID } = req.body;
      const rideRequest = await startRide(io, driverID, rideID);
      io.emit('ride-started', rideRequest); // Notify all clients about the started ride
      res.status(200).json(rideRequest);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Complete a ride
  router.post('/complete', async (req, res) => {
    try {
      const { driverID, rideID } = req.body;
      const rideRequest = await completeRide(io, driverID, rideID);
      io.emit('ride-completed', rideRequest); // Notify all clients about the completed ride
      res.status(200).json(rideRequest);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Cancel a ride
  router.post('/cancel', async (req, res) => {
    try {
      const { userID, rideID } = req.body;
      const rideRequest = await cancelRide(io, userID, rideID);
      io.emit('ride-canceled', rideRequest); // Notify all clients about the canceled ride
      res.status(200).json(rideRequest);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  return router;
};

export default rideRoutes;
