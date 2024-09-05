import { listAvailableTransportCategories } from "../services/transport.service.js";

// Controller to handle fetching available cabs
export const getAvailableTransportController = async (req, res) => {
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
      const cabs = await listAvailableTransportCategories(startLocation, endLocation);
      res.status(200).json({ status: true, message: "Transport vehicle details fetched", data: cabs });
    } catch (error) {
      res.status(500).json({ status: false, message: error.message, data: {} });
    }
  };