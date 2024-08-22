import express from "express";
import {createRideRequest,
     acceptRide,
      startRide,
       completeRide,
        cancelRide} from "../services/ride.service.js"

const router = express.Router();

const rideRoutes = (webSocketServer) => {

  // Create a ride request
  router.post('/request', async (req, res) => {
    try {
      const { userID, pickupLocation, dropLocation } = req.body;
      const rideRequest = await createRideRequest(webSocketServer, userID, pickupLocation, dropLocation);
      res.status(201).json(rideRequest);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Accept a ride request
  router.post('/accept', async (req, res) => {
    try {
      const { driverID, rideID } = req.body;
      const rideRequest = await acceptRide(webSocketServer, driverID, rideID);
      res.status(200).json(rideRequest);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Start a ride
  router.post('/start', async (req, res) => {
    try {
      const { driverID, rideID } = req.body;
      const rideRequest = await startRide(webSocketServer, driverID, rideID);
      res.status(200).json(rideRequest);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Complete a ride
  router.post('/complete', async (req, res) => {
    try {
      const { driverID, rideID } = req.body;
      const rideRequest = await completeRide(webSocketServer, driverID, rideID);
      res.status(200).json(rideRequest);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Cancel a ride
  router.post('/cancel', async (req, res) => {
    try {
      const { userID, rideID } = req.body;
      const rideRequest = await cancelRide(webSocketServer, userID, rideID);
      res.status(200).json(rideRequest);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  return router;
};

export default rideRoutes;