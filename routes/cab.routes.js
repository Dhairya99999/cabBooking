import express from 'express';
import { getAvailableCabs, fetchCabDetails, fetchBookingHistory, triggerRideRequestController, cancelRideRequestController, completeRideController, fetchRideBookingHistory, fetchTransportBookingHistory } from '../controllers/cab.controller.js';
import { verifyToken } from '../middlewares/auth.js';

const router = express.Router();

// Route to get available cabs
router.get('/cab-listing', getAvailableCabs);
// Route to get cab details
router.post('/cab-details', fetchCabDetails);
// Route to get booking history
router.get('/booking-history', verifyToken, fetchBookingHistory);
//Route for trigger request
router.post('/trigger-ride-request',triggerRideRequestController)
//cancelling the ride request
router.post('/ride/cancel', verifyToken, cancelRideRequestController);
//billing
router.post('/ride/completed', completeRideController);

//route for history for superAdmin
router.get('/ride-history', fetchRideBookingHistory);
router.get('/transport-history', fetchTransportBookingHistory);
export default router;
