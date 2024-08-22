import Driver from '../models/driver.model.js'; // Ensure this import is correct
import { calculateDistance, calculateFare } from '../utils/locationUtils.js'; // Utility functions for distance and fare calculation

const listAvailableCabs = async (startLocation, endLocation) => {
  const query = { isAvailable: true };

  if (startLocation) {
    query.location = {
      $near: {
        $geometry: {
          type: 'Point',
          coordinates: [parseFloat(startLocation.startLng), parseFloat(startLocation.startLat)],
        },
        $maxDistance: 10000, // 10 km range
      },
    };
  }

  // Fetch available drivers
  // const drivers = await Driver.find(query).populate('carDetails');
    const drivers = await Driver.find().populate('carDetails');   
  // Calculate the distance between start and end locations once
  const distance = calculateDistance(startLocation, endLocation);

  // Prepare the list of cabs with calculated fare
  const cabs = drivers.map((driver) => {
    const fare = calculateFare(driver.carDetails.rate_per_km, distance);

    return {
      id: driver.carDetails._id.toString(),
      car_model: driver.carDetails.model,
      car_type: driver.carDetails.type,
      rate_per_km: `₹${driver.carDetails.rate_per_km}`,
      tagline: driver.carDetails.tagline || 'Your ride, your choice',
      fare: `₹${parseFloat(fare.toFixed(2))}`, // Fare calculated based on distance and rate per km
      fare_amount_display: `₹${fare.toFixed(2)}`, // Display format with currency symbol
      image_url :driver.carDetails.imageUrl,
    };
  });

  // Return a single distance value and the array of cabs
  return {
    distance: `${parseFloat(distance.toFixed(2))} Km`, // Distance in km, rounded to 2 decimal places
    cabs: cabs, // Array of cabs
  };
};

export default listAvailableCabs;
