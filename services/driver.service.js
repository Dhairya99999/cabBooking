import Driver from "../models/driver.model.js";

export const updateLocation = async (driver_id, driver_lat, driver_lng) => {
    try {
      // Validate input 
      if (!driver_id || isNaN(driver_lat) || isNaN(driver_lng)) {
        throw new Error('Invalid input parameters');
      }
  
      // Update the driver's location
      const result = await Driver.updateOne(
        { _id: driver_id },
        { $set: { 'location.coordinates': [parseFloat(driver_lng), parseFloat(driver_lat)] } }
      );
  
      // Check if the update was successful
      if (result.nModified === 0) {
        throw new Error('Driver not found or location unchanged');
      }
  
      return 'Location updated successfully';
    } catch (error) {
      console.error('Error updating driver location:', error.message);
      throw new Error('Failed to update driver location');
    }
  }