
import { updateLocation } from "../services/driver.service.js";

export const updateLocationController = async (req,res)=>{
    try{
        const {driver_id, driver_lat, driver_lng} = req.body;
        const response = await updateLocation(driver_id,driver_lat, driver_lng);
        return res.status(200).json({status:true, message:response, data:{}});
    }catch(error){
        return res.status(500).json({status:false, message: error.message, data:{}})
    }
}