import { listAvailableTransportCategories, getTransportVehicleDetails, getGoodsTypes } from "../services/transport.service.js";

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