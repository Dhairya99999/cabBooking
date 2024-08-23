import { getCabDetails, getBookingHistory, listAvailableCabs } from '../services/cab.service.js';

// Controller to handle fetching available cabs
export const getAvailableCabs = async (req, res) => {
  try {
    const { startLng, startLat, endLng, endLat } = req.query;

    // Validate and create location objects
    const startLocation = startLng && startLat ? { startLng: parseFloat(startLng), startLat: parseFloat(startLat) } : null;
    const endLocation = endLng && endLat ? { endLng: parseFloat(endLng), endLat: parseFloat(endLat) } : null;

    // Check if locations are valid
    if (!startLocation || !endLocation) {
      return res.status(400).json({ status: false, message: 'Invalid location parameters', data: {} });
    }

    // Fetch available cabs
    const cabs = await listAvailableCabs(startLocation, endLocation);
    res.status(200).json({ status: true, message: "Cab details fetched", data: cabs });
  } catch (error) {
    res.status(500).json({ status: false, message: error.message, data: {} });
  }
};

// Controller to handle fetching cab details
export const fetchCabDetails = async (req, res) => {
  try {
    const { car_id, startLat, startLng, endLat, endLng } = req.body;

    const response = await getCabDetails(startLat, startLng, endLat, endLng, car_id);
    if (response) {
      res.status(200).json({ status: true, message: "Cab details fetched", data: response });
    } else {
      res.status(200).json({ status: false, message: "Cab details cannot be fetched", data: {} });
    }
  } catch (error) {
    res.status(500).json({ status: false, message: error.message, data: {} });
  }
};

// Controller to handle fetching booking history
export const fetchBookingHistory = async (req, res) => {
  try {
    const userId = req.user.userId; // Assuming req.user is set by the auth middleware
    const bookingHistory = await getBookingHistory(userId);
    res.status(200).json({ status: true, message: "Booking History Fetched", data: bookingHistory });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
