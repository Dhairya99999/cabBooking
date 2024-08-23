import Driver from '../models/driver.model.js';
import Car from '../models/car.model.js';
import Booking from "../models/booking.model.js"
import { calculateDistance, calculateFare } from '../utils/locationUtils.js'; // Utility functions for distance and fare calculation
import axios from "axios";
import { formatDate } from '../utils/miscUtils.js';

export const listAvailableCabs = async (startLocation, endLocation) => {
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

    const drivers = await Driver.find().populate('carDetails');   //just for development purposes to list data
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


export const getCabDetails = async (startLat, startLng, endLat, endLng, cabId) => {
  try {
    // fetching details
    const carDetails = await Car.findById(cabId).exec();

    // Check if car details exist
    if (!carDetails) {
      throw new Error('Car not found');
    }

    // Fetch driver details related to the car
    const driverDetails = await Driver.findOne({ carDetails: cabId }).exec();

    //fetch geolocation
    const [startRoute, endRoute] = await Promise.all([
      getLocationName(startLat, startLng),
      getLocationName(endLat, endLng)
    ]);

    //remove extra address
    const cleanStartRoute = startRoute.replace(/,\s*\b\w+\+\w+\b\s*|\b\w+\+\w+\b\s*,?\s*/g, '').trim();
    const cleanEndRoute = endRoute.replace(/,\s*\b\w+\+\w+\b\s*|\b\w+\+\w+\b\s*,?\s*/g, '').trim();

    //calculate pickup time
    const pickupTime = await calculatePickupTime(driverDetails.location.coordinates[0], driverDetails.location.coordinates[1], startLat, startLng);


    // Format the response
    const response = {
      route: `${cleanStartRoute} - ${cleanEndRoute}`,  
      date: formatDate(new Date()), 
      pickup_time: pickupTime, 
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
      driver_details: {
        verification: driverDetails.verification_text,
        driver_rating: driverDetails.driver_rating,
        cab_rating: carDetails.rating,  
      },
      inclusions: carDetails.inclusions,
      extracharge: carDetails.extracharge,
      additional_info: driverDetails.additional_information
    };

    return response;
  } catch (error) {
    console.error(error);
    throw new Error('Error fetching cab details');
  }
};

// geolocation name
async function getLocationName(latitude, longitude) {
  const API_KEY = process.env.GOOGLE_API_KEY;
  const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${API_KEY}`;
  try {
      const response = await axios.get(url);
      const results = response.data.results;

      if (results.length > 0) {
          return results[0].formatted_address;
      } else {
          return 'No location found';
      }
  } catch (error) {
      console.error('Error fetching location:', error);
      return 'Error fetching location';
  }
}

//pickup time
async function calculatePickupTime(driverLat, driverLng, startLat, startLng) {
  const API_KEY = process.env.GOOGLE_API_KEY;
  const url = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${driverLat},${driverLng}&destinations=${startLat},${startLng}&key=${API_KEY}`;
  try {
    const response = await axios.get(url);
    const result = response.data.rows[0].elements[0];
    if (result.status === 'OK') {
      const duration = `${Math.round(result.duration.value/60)} minutes`; // duration in seconds
      return duration 
    } else {
      throw new Error(`API returned status: ${result.status}`);
    }
  } catch (error) {
    console.error('Error calculating pickup time:', error.response ? error.response.data : error.message);
    return 'Error calculating pickup time';
  }
}

export const getBookingHistory = async (userId) => {
  try {
    // Fetch all bookings for the user

    // const bookings = await Booking.find({ user: userId }); !!important
    const bookings = await Booking.find(); // just for development purposes to display data

    // Separate bookings into categories
    const cancelledBookings = bookings.filter(booking => booking.status === 'CANCELLED');
    const ongoingAndCompletedBookings = bookings.filter(booking => booking.status !== 'CANCELLED');

    return {
  
      cancelledBookings: cancelledBookings.map(booking => ({
        id: booking._id.toString(),
        status: booking.status,
        car_name: booking.car_name,
        car_image: booking.car_image,
        startLocation: booking.startLocation,
        endLocation: booking.endLocation,
        kmCovered: `${booking.kmCovered} km`,
        amountPaid: `₹${booking.amountPaid}`,
        date: formatDate(booking.date),
      })),
      ongoingAndCompletedBookings: ongoingAndCompletedBookings.map(booking => ({
        id: booking._id.toString(),
        status: booking.status,
        car_name: booking.car_name,
        car_image: booking.car_image,
        startLocation: booking.startLocation,
        endLocation: booking.endLocation,
        kmCovered: `${booking.kmCovered} km`,
        amountPaid: `₹${booking.amountPaid}`,
        date: formatDate(booking.date),
      })),
    };
  } catch (error) {
    throw new Error('Error fetching booking history: ' + error.message);
  }
};