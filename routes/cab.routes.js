import express from 'express';
import listAvailableCabs, { getCabDetails } from '../services/cab.service.js';

const router = express.Router();

router.get('/cab-listing', async (req, res) => {
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
});

router.get('/cab-details', async(req,res)=>{
  try{
    const {car_id} = req.query;

    const response = await getCabDetails(car_id);
    if(response){
      res.status(200).json({status:true, message:"Cab details fetched", data: response })
    }
    else
    res.status(200).json({status:false, message:"Cab details cannot be fetched", data: {} })
  }catch(error){
    res.status(500).json({status:false, message:error.message, data:{}});
  }
})

export default router;
