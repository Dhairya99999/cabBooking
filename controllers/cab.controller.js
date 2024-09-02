import { getCabDetails, getBookingHistory, listAvailableCabs, triggerRideRequest, cancelRideRequest, completeRide } from '../services/cab.service.js';

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
    const { car_id, start_lat, start_lng, end_lat, end_lng } = req.body;

    const response = await getCabDetails(start_lat, start_lng, end_lat, end_lng, car_id);
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
    res.status(500).json({ status: false, message: error.message, data:{} });
  }
};

export const triggerRideRequestController = async (req,res)=>{
  try{
    const {userId, cab_id, pickup_address, pickup_lat, pickup_lng, drop_address, drop_lat, drop_lng} = req.body;
    let missingFields = [];
    if (!userId) missingFields.push("user");
    if (!cab_id) missingFields.push("cab");
    if (!pickup_address) missingFields.push("pickup address");
    if (pickup_lat == null) missingFields.push("pickup latitude");
    if (pickup_lng == null) missingFields.push("pickup longitude");
    if (!drop_address) missingFields.push("drop address");
    if (drop_lat == null) missingFields.push("drop latitude");
    if (drop_lng == null) missingFields.push("drop longitude");

    if (missingFields.length > 0) {
      return res.status(400).json({
        status: false,
        message: `Missing fields: ${missingFields.join(", ")}`,
        data: {}
      });
    }

    const io = req.app.get('io');

    const response = await triggerRideRequest(io, userId, cab_id, pickup_address, pickup_lat, pickup_lng, drop_address, drop_lat, drop_lng);
    if(!response){
      res.status(400).json({status:false, message:"Cannot initiate a request", data:{}})
    }
    res.status(200).json({status:true, message:"Success", data:{ride_id:response}})
  }catch(error){
    res.status(500).json({status:false, message:error.message, data:{}})
  }
}

export const cancelRideRequestController = async (req,res) =>{
try{
  const io = req.app.get('io');
const user_id = req.user.userId;
const {ride_id} = req.body;
const response = await cancelRideRequest(io, user_id, ride_id);
if (!response){
  throw "Error cancelling Ride"
}
res.status(200).json({status:true, message: response, data:{}})
}catch(error)
{
  res.status(500).json({status:false, message:error, data:{}})
}
}

export const completeRideController = async (req, res) => {
  try {
    const { ride_id } = req.body;

    
    if (!ride_id) {
      throw new Error('Ride ID is required');
    }

    // Fetch ride details
    const response = await completeRide(ride_id);

    // Check if response is valid
    if (!response) {
      throw new Error('Error billing the ride');
    }

  
    res.status(200).json({
      status: true,
      message: 'Billing details are fetched',
      data: response 
    });

  } catch (error) {
    // Log error details for debugging
    console.error('Error in completeRideController:', error);

    // Send error response
    res.status(500).json({
      status: false,
      message: error.message || 'Internal server error',
      data: {}
    });
  }
};