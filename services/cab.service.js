import Driver from '../models/driver.model.js';
import Car from '../models/car.model.js';
import Booking from "../models/booking.model.js"
import Category from '../models/category.model.js';
import { calculateDistance, calculateFare } from '../utils/locationUtils.js'; // Utility functions for distance and fare calculation
import axios from "axios";
import { formatDate } from '../utils/miscUtils.js';
import { UserModel } from '../models/user.model.js';
import Ride from '../models/ride.model.js';
import geolib from 'geolib';


const broadcastMessage = (io,event,message) =>{
  io.emit(event,message);
}



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

  
    const categories = await Category.find().populate('carDetails');  

  // Calculate the distance between start and end locations once
  const distance = calculateDistance(startLocation, endLocation);

  // Prepare the list of cabs with calculated fare
  const cabs = categories.map((category) => {
    const carDetails = category.carDetails[0];
    const fare = calculateFare(carDetails?.rate_per_km, distance);

    return {
      id: carDetails?._id,
      car_model: carDetails?.car_name,
      car_type: carDetails?.car_type,
      rate_per_km: `₹${carDetails?.rate_per_km}`,
      tagline: carDetails?.tagline || 'Your ride, your choice',
      fare: `₹${parseFloat(fare.toFixed(2))}`, // Fare calculated based on distance and rate per km
      fare_amount_display: `₹${fare.toFixed(2)}`, // Display format with currency symbol
      image_url :carDetails?.image_url,
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
    // const cleanStartRoute = startRoute.replace(/,\s*\b\w+\+\w+\b\s*|\b\w+\+\w+\b\s*,?\s*/g, '').trim();
    // const cleanEndRoute = endRoute.replace(/,\s*\b\w+\+\w+\b\s*|\b\w+\+\w+\b\s*,?\s*/g, '').trim();

    //calculate pickup time
    const pickupTime = await calculatePickupTime(driverDetails.location.coordinates[0], driverDetails.location.coordinates[1], startLat, startLng);


    // Format the response
    const response = {
      route: `${startRoute} - ${endRoute}`,  
      date: formatDate(new Date()), 
      pickup_time: pickupTime.formattedDuration, 
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
      extra_charges: carDetails.extracharge,
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
      const addressComponents = results[0].address_components;

      // Define the types we are interested in, in the desired order
      const targetTypes = [    
        "sublocality_level_2",    
        "sublocality_level_1",
        "administrative_area_level_3",
        // "administrative_area_level_1",
      ];

      // Create an object to map the types to their long_names
      const typeToLongName = {};

      addressComponents.forEach(component => {
        component.types.forEach(type => {
          if (targetTypes.includes(type)) {
            typeToLongName[type] = component.long_name || null;
          }
        });
      });

      // Map the target types to their corresponding long_names and filter out null values
      const orderedLongNames = targetTypes
        .map(type => typeToLongName[type])
        .filter(name => name !== null && name !== undefined); // Ensure null and undefined are filtered out

      // Return the orderedLongNames array or a message if it's empty
      return orderedLongNames.length > 0 ? orderedLongNames : 'No location found';
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
      const distance = result.distance.text;
      const durationInSeconds = result.duration.value; // duration in seconds
      const durationInMinutes = Math.round(durationInSeconds / 60);
      
      // Calculate hours and minutes
      const hours = Math.floor(durationInMinutes / 60);
      const minutes = durationInMinutes % 60;
      
      // Format duration
      let formattedDuration = '';
      if (hours > 0) {
        formattedDuration += `${hours} hour${hours > 1 ? 's' : ''}`;
      }
      if (minutes > 0) {
        if (formattedDuration) {
          formattedDuration += ' ';
        }
        formattedDuration += `${minutes} min${minutes > 1 ? 's' : ''}`;
      }
      
      return {
        formattedDuration: formattedDuration || '0 minutes',
        distance
      };
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


export const triggerRideRequest = async (io, userId, cab_id, pickup_address, pickup_lat, pickup_lng, drop_address, drop_lat, drop_lng) => {
  try {
    // Fetch user and cab details
    const user = await UserModel.findById(userId).exec();
    const cab = await Car.findById(cab_id).exec();
    const driverDetails = await Driver.find({ carDetails: cab_id, is_on_duty: true }).exec(); // Fetch all drivers that are on duty

    if (!user) {
      throw new Error("User does not exist");
    }
    if (!cab) {
      throw new Error("Cab does not exist");
    }

    // Calculate trip distance and duration
    const trip = await calculatePickupTime(pickup_lat, pickup_lng, drop_lat, drop_lng);
    const trip_distance = trip.distance; 
    const trip_duration = trip.formattedDuration;

    // Calculate trip amount
    const distance = parseFloat(trip_distance);
    const ratePerKm = parseFloat(cab.rate_per_km);
    const trip_amount = `₹ ${(distance * ratePerKm).toFixed(2)}`; // Format as string

    // Format the current time
    const date = new Date();
    const options = { hour: '2-digit', minute: '2-digit', hour12: true };
    const current_time = date.toLocaleTimeString('en-US', options);

    const user_name = `${user.firstName} ${user.lastName}`;

    // Create a base object for the ride request
    const baseRideRequest = {
      current_time: current_time.toString(),
      user_name: user_name.toString(),
      trip_distance: trip_distance, 
      trip_duration: trip_duration, 
      trip_amount: trip_amount, 
      pickup_address: pickup_address.toString(),
      pickup_lat: pickup_lat.toString(),
      pickup_lng: pickup_lng.toString(),
      drop_address: drop_address.toString(),
      drop_lat: drop_lat.toString(),
      drop_lng: drop_lng.toString(),
      userId: userId,
    };

    // Create a new ride request
    const ride = new Ride(baseRideRequest);
    const savedRide = await ride.save();

    // Calculate distances and times for each driver
    const driversWithDetails = await Promise.all(driverDetails.map(async (driver) => {
      const driverLocation = { latitude: driver.location.coordinates[0], longitude: driver.location.coordinates[1] };
      const pickupLocation = { latitude: pickup_lat, longitude: pickup_lng };
      const distance = geolib.getDistance(driverLocation, pickupLocation);

      // Calculate pickup time for this driver
      const pickupTime = await calculatePickupTime(driverLocation.latitude, driverLocation.longitude, pickup_lat, pickup_lng);
      const pickup_distance = pickupTime.distance; 
      const pickup_duration = pickupTime.formattedDuration; 

      return { ...driver.toObject(), distance, pickup_distance, pickup_duration };
    }));

    // Sort drivers by distance (nearest first)
    driversWithDetails.sort((a, b) => a.distance - b.distance);

    // Function to emit ride request to the next driver in the list
    const emitToDriver = async (index) => {
      if (index >= driversWithDetails.length-1) {
        console.log('All drivers have been notified or no driver is available.');
        await Ride.findByIdAndUpdate(savedRide._id, {
          isSearching : false
        }, { new: true });
        return;
      }

      const driver = driversWithDetails[index];
      const rideRequest = {
        ...baseRideRequest,
        pickup_distance: driver.pickup_distance,
        pickup_duration: driver.pickup_duration,
      };

      // Update the existing ride with new pickup location and duration
      await Ride.findByIdAndUpdate(savedRide._id, {
        pickup_distance: driver.pickup_distance,
        pickup_duration: driver.pickup_duration,
      }, { new: true });

      // io.to(driver.socketId).emit('ride-request', { ride_id: savedRide._id, ...rideRequest });
      io.emit('ride-request', { ride_id: savedRide._id, ...rideRequest });
      // Set a timeout to check the ride status and re-emit if not accepted
      setTimeout(async () => {
        const updatedRide = await Ride.findById(savedRide._id).exec();
        if (updatedRide && updatedRide.status_accept === false) {
          emitToDriver(index + 1); // Move to the next driver
        }
      }, 2000); // 20 seconds
    };

    // Start emitting the request to the first driver
    emitToDriver(0);

    return "Success";
  } catch (error) {
    console.error('Error triggering ride request:', error.message);
    throw new Error('Failed to trigger ride request');
  }
};