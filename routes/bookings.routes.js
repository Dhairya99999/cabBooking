import express from 'express';
import getBookingHistory from '../services/booking.service.js';
import { verifyToken } from '../middlewares/auth.js'; 

const router = express.Router();

router.get('/booking-history', verifyToken, async (req, res) => {
  try {
    const userId = req.user.userId; // Assuming req.user is set by the auth middleware
    const bookingHistory = await getBookingHistory(userId);
    res.status(200).json(bookingHistory);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
