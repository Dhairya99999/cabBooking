import express from 'express';
import { getAvailableCabs, fetchCabDetails, fetchBookingHistory } from '../controllers/cab.controller.js';
import { verifyToken } from '../middlewares/auth.js';

const router = express.Router();

// Route to get available cabs
router.get('/cab-listing', getAvailableCabs);
// Route to get cab details
router.post('/cab-details', fetchCabDetails);
// Route to get booking history
router.get('/booking-history', verifyToken, fetchBookingHistory);

export default router;
