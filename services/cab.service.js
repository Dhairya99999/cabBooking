import Driver from '../models/driver.model.js'; // Ensure this import is correct
import Car from '../models/car.model.js';
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

  // const drivers = await Driver.find(query).populate('carDetails');  //IMPORTANT

    const drivers = await Driver.find().populate('carDetails');   
  // Calculate the distance between start and end locations once
  const distance = calculateDistance(startLocation, endLocation);

  // Prepare the list of cabs with calculated fare
  const cabs = drivers.map((driver) => {
    const fare = calculateFare(driver.carDetails.rate_per_km, distance);

    return {
      id: driver.carDetails._id.toString(),
      car_model: driver.carDetails.car_name,
      car_type: driver.carDetails.car_type,
      rate_per_km: `₹${driver.carDetails.rate_per_km}`,
      tagline: driver.carDetails.tagline || 'Your ride, your choice',
      fare: `₹${parseFloat(fare.toFixed(2))}`, // Fare calculated based on distance and rate per km
      fare_amount_display: `₹${fare.toFixed(2)}`, // Display format with currency symbol
      image_url :driver.carDetails.image_url,
    };
  });

  // Return a single distance value and the array of cabs
  return {
    distance: `${parseFloat(distance.toFixed(2))} Km`, // Distance in km, rounded to 2 decimal places
    cabs: cabs, // Array of cabs
  };
};

export default listAvailableCabs;

export const getCabDetails = async (cabId) => {
  try {
    // fetching details
    const carDetails = await Car.findById(cabId).exec();

    // Check if car details exist
    if (!carDetails) {
      throw new Error('Car not found');
    }

    // Fetch driver details related to the car
    const driverDetails = await Driver.find({ carDetails: cabId }).exec();

    // Format the response
    const response = {
      route: '',  
      date: new Date().toISOString(), 
      pickup_time: '', 
      car: {
        car_name: carDetails.car_name,
        car_type: carDetails.car_type,
        image_url: carDetails.image_url,
        category: carDetails.category,
        ac: carDetails.ac,
        passenger_capacity: carDetails.passenger_capacity,
        luggage_capacity: carDetails.luggage_capacity,
        car_size: carDetails.car_size,
        rating: carDetails.rating,
        total_ratings: carDetails.total_ratings,
        extra_km_fare: carDetails.extra_km_fare,
        fuel_type: carDetails.fuel_type,
        cancellation_policy: carDetails.cancellation_policy,
        free_waiting_time: carDetails.free_waiting_time,
      },
      driver_details: driverDetails.map(driver => ({
        verification: driver.isVerified,
        driver_rating: driver.driver_rating,
        cab_rating: carDetails.rating,  
      })),
      inclusions: carDetails.inclusions,
      extracharge: carDetails.extracharge,
      additional_info: driverDetails.flatMap(driver => driver.additional_information)
    };

    return response;
  } catch (error) {
    console.error(error);
    throw new Error('Error fetching cab details');
  }
};
