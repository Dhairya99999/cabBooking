import { listAvailableTransportCategories, getTransportVehicleDetails, getGoodsTypes, triggerParcelRequest } from "../services/transport.service.js";

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
  export const getTransportVehicleDetailsController = async(req,res) =>{
    try{
      const {vehicle_id, start_lat, start_lng, end_lat, end_lng} = req.body;

      

      const response = await getTransportVehicleDetails(start_lat, start_lng, end_lat, end_lng, vehicle_id);

    if (response) {
      res.status(200).json({ status: true, message: "Transport details fetched", data: response });
    } else {
      res.status(200).json({ status: false, message: "Transport details cannot be fetched", data: {} });
    }

    }catch (error) {
    res.status(500).json({ status: false, message: error.message, data: {} });
  }
  }

export const getGoodsController = async(req,res)=>{
  try{
  const {category_id} = req.params;

const response = await getGoodsTypes(category_id);
if(!response){
  throw new Error("Error fetching goods");
}
res.status(200).json({status:true, message:"Goods fetched", data: response})

  }catch (error) {
    res.status(500).json({ status: false, message: error.message, data: {} });
  }
}

export const triggerParcelRequestController = async (req, res) => {
  try {
    const user_id = req.user.userId;
    const io = req.app.get('io');

    const {
      reciever_name,
      reciever_mobileNumber,
      transport_type,
      pickup_address,
      drop_address,
      pickup_lat,
      pickup_lng,
      drop_lat,
      drop_lng,
      vehicle_id,
      goods_type
    } = req.body;

    // Manual validation
    const missingFields = [];
    const errors = {};

    if (!reciever_name) missingFields.push('reciever_name');
    if (!reciever_mobileNumber) missingFields.push('reciever_mobileNumber');
    if (!transport_type) missingFields.push('transport_type');
    if (!pickup_address) missingFields.push('pickup_address');
    if (!drop_address) missingFields.push('drop_address');
    if (pickup_lat == null) missingFields.push('pickup_lat');
    if (pickup_lng == null) missingFields.push('pickup_lng');
    if (drop_lat == null) missingFields.push('drop_lat');
    if (drop_lng == null) missingFields.push('drop_lng');
    if (!vehicle_id) missingFields.push('vehicle_id');
    if (!goods_type) missingFields.push('goods_type');

    if (missingFields.length > 0) {
      return res.status(400).json({
        status: false,
        message: 'Missing fields',
        data: {
          missingFields
        }
      });
    }

    // Validate reciever_mobileNumber format (assuming it should be a string of digits)
    const mobileNumberPattern = /^[0-9]{10}$/;
    if (!mobileNumberPattern.test(reciever_mobileNumber)) {
      errors.reciever_mobileNumber = 'Invalid mobile number format';
    }

    // Validate latitudes and longitudes (assuming they should be numbers)
    if (isNaN(pickup_lat) || isNaN(pickup_lng) || isNaN(drop_lat) || isNaN(drop_lng)) {
      errors.coordinates = 'Latitude and longitude must be valid numbers';
    }

    if (Object.keys(errors).length > 0) {
      return res.status(400).json({
        status: false,
        message: 'Validation errors',
        data: errors
      });
    }

    const response = await triggerParcelRequest(io, reciever_name, reciever_mobileNumber, transport_type, pickup_address, drop_address, pickup_lat, pickup_lng, drop_lat, drop_lng, vehicle_id, user_id, goods_type);

    if (!response) {
      return res.status(400).json({ status: false, message: 'Cannot initiate a request', data: {} });
    }

    res.status(200).json({ status: true, message: 'Success', data: { ride_id: response } });

  } catch (error) {
    res.status(500).json({ status: false, message: error.message, data: {} });
  }
};