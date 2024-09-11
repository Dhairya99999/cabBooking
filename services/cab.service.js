import Driver from '../models/driver.model.js';
import Category from '../models/category.model.js';
import Ride from '../models/ride.model.js';
import transportRide from "../models/transport.ride.model.js";
import { calculateDistance, calculateFare } from '../utils/locationUtils.js'; // Utility functions for distance and fare calculation
import axios from "axios";
import { formatDate } from '../utils/miscUtils.js';
import { UserModel } from '../models/user.model.js';
import geolib from 'geolib';

const broadcastMessage = (io,event,message) =>{
  io.emit(event,message);
}
function convertCurrencyStringToNumber(currencyString) {
  // Remove the currency symbol and any commas or spaces
  const numericString = currencyString.replace(/[^0-9.-]/g, '');
  // Convert to number
  return parseFloat(numericString);
}

function findMinimumDuration(durations) {
  // Helper function to convert duration to minutes
  const convertToMinutes = (duration) => {
      // Initialize hours and minutes
      let hours = 0;
      let minutes = 0;

      // Split the duration into parts
      const parts = duration.split(' ');

      // Extract hours and minutes
      for (let i = 0; i < parts.length; i++) {
          if (parts[i].endsWith('hours')) {
              hours = parseInt(parts[i - 1], 10);
          } else if (parts[i].endsWith('mins')) {
              minutes = parseInt(parts[i - 1], 10);
          }
      }

      // Convert total time to minutes
      return hours * 60 + minutes;
  };

  // Convert all durations to minutes
  const durationsInMinutes = durations.map(convertToMinutes);

  // Find the minimum duration in minutes
  const minDurationInMinutes = Math.min(...durationsInMinutes);

  // Return the minimum duration in a readable format
  const minHours = Math.floor(minDurationInMinutes / 60);
  const minMinutes = minDurationInMinutes % 60;

  return `${minHours} hours ${minMinutes} mins`;
}

function formatDateTime(inputDateStr) {
  // Convert the string to a Date object
  const dateObj = new Date(inputDateStr);
  
  // Extract date components
  const weekday = dateObj.toLocaleDateString('en-US', { weekday: 'short' });
  const month = dateObj.toLocaleDateString('en-US', { month: 'short' });
  const day = dateObj.getDate().toString().padStart(2, '0');
  const year = dateObj.getFullYear();
  const hours24 = dateObj.getHours();
  const minutes = dateObj.getMinutes().toString().padStart(2, '0');
  
  // Convert to 12-hour format
  const isPM = hours24 >= 12;
  const hours12 = hours24 % 12 || 12;
  const period = isPM ? 'PM' : 'AM';
  
  // Format the final output
  return `${weekday} ${month} ${day} ${year} ${hours12}:${minutes} ${period}`;
}

const isToday = (date) => {
  const today = new Date();
  const givenDate = new Date(date);
  return today.toDateString() === givenDate.toDateString();
};

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

  
  const categories = await Category.find({ category_type: { $in: ["ride", "both"] } }); // find cabs that are used for ride or for both transport and rides

  // Calculate the distance between start and end locations once
  const distance = calculateDistance(startLocation, endLocation);

  // Prepare the list of cabs with calculated fare
  const cabs = categories.map((category) => {
    const fare = calculateFare(category.rate_per_km, distance);
    const rounded_fare = Math.ceil(fare);
    return {
      id: category._id,
      car_model: category.category_name,
      car_type: category.category_name,
      rate_per_km: `₹${category.rate_per_km}`,
      tagline: category.tagline || 'Your ride, your choice',
      fare: `₹${parseFloat(fare.toFixed(2))}`, // Fare calculated based on distance and rate per km
      fare_amount_display: `₹${rounded_fare}`, // Display format with currency symbol
      image_url :category.image_url,
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
    const carDetails = await Category.findById(cabId).exec();

    // Check if car details exist
    if (!carDetails) {
      throw new Error('Car not found');
    }

    // Fetch driver details related to the car
    const driverDetails = await Driver.find({ carDetails: cabId }).exec();

    //fetch geolocation
    const [startRoute, endRoute] = await Promise.all([
      getLocationName(startLat, startLng),
      getLocationName(endLat, endLng)
    ]);

    const pickupTimes = await Promise.all(driverDetails.map(async (driver) => {
      const pickupTime = await calculatePickupTime(
          driver.location.coordinates[0], // longitude
          driver.location.coordinates[1], // latitude
          startLat,
          startLng
      );
      return pickupTime.formattedDuration; // Assuming formattedDuration is a string like "1h 30m"
  }));


 // Find the lowest pickup time
  const lowestPickupTime = findMinimumDuration(pickupTimes);
    //remove extra address
    // const cleanStartRoute = startRoute.replace(/,\s*\b\w+\+\w+\b\s*|\b\w+\+\w+\b\s*,?\s*/g, '').trim();
    // const cleanEndRoute = endRoute.replace(/,\s*\b\w+\+\w+\b\s*|\b\w+\+\w+\b\s*,?\s*/g, '').trim();

    //calculate pickup time
    //const pickupTime = await calculatePickupTime(driverDetails.location.coordinates[0], driverDetails.location.coordinates[1], startLat, startLng);
    const distance = await calculatePickupTime(startLat, startLng, endLat, endLng);

    // Format the response
    const response = {
      route: `${startRoute} - ${endRoute}`,  
      date: formatDate(new Date()), 
      pickup_time: lowestPickupTime, 
      car: {
        car_name: carDetails.category_name,
        car_type: carDetails.category_name,
        image_url: carDetails.image_url,
        category: carDetails.category_name,
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
        verification: carDetails.verification,
        driver_rating: driverDetails.driver_rating,
        cab_rating: carDetails.rating,  
      },
      inclusions:{ included_kms: distance.distance,
                  ...carDetails.inclusions,
      },
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
     const [rideBookings, transportRideBookings] = await Promise.all([
      Ride.find({
        userId: userId,
        status: { $in: ['Cancelled', 'Ongoing', 'Accepted', 'Completed'] }
      })
      .populate('driverId')
      .exec(),

      transportRide.find({
        userId: userId,
        status: { $in: ['Cancelled', 'Ongoing', 'Accepted', 'Completed'] }
      })
      .populate('driverId')
      .exec()
    ]);

        // Combine bookings
        const allBookings = [...rideBookings, ...transportRideBookings];

    // Separate bookings into categories
    const cancelledBookings = allBookings.filter(booking => booking.status === 'Cancelled');
    const ongoingAndCompletedBookings = allBookings.filter(booking =>
      ['Ongoing', 'Accepted', 'Completed'].includes(booking.status)
    );

    return {
      cancelledBookings: cancelledBookings.map(booking => ({
        id: booking._id.toString(),
        status: booking.status,
        car_name: booking.driverId.vehicle_model,
        car_image: booking.driverId.vehicle_image,
        startLocation: booking.pickup_address,
        endLocation: booking.drop_address,
        date: isToday(booking.booking_date) ? 'Today' : formatDate(new Date(booking.booking_date)),
      })),
      ongoingAndCompletedBookings: ongoingAndCompletedBookings.map(booking => ({
        id: booking._id.toString(),
        status: booking.status,
        car_name: booking.driverId.vehicle_model,
        car_image: booking.driverId.vehicle_image,
        startLocation: booking.pickup_address,
        endLocation: booking.drop_address,
        kmCovered: `${booking.trip_distance}`,
        amountPaid: `${booking.total_amount || booking.trip_amount}`,
        date: isToday(booking.booking_date) ? 'Today' : formatDate(new Date(booking.booking_date)),
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
    const cab = await Category.findById(cab_id).exec();
    const driverDetails = await Driver.find({
      carDetails: cab_id,         // Match drivers with specific category
      is_on_duty: true,           // Ensure the driver is on duty
      $or: [
        { on_going_ride_id: { $exists: false } }, // ensure that the driver is not on another ride
      ]
    }).exec();
    if (!user) {
      throw new Error("User does not exist");
    }
    if (!cab) {
      throw new Error("Cab does not exist");
    }

    if(user.on_going_ride_id){
      throw new Error("You already have an existing ride");
    }

    // Calculate trip distance and duration
    const trip = await calculatePickupTime(pickup_lat, pickup_lng, drop_lat, drop_lng);
    const trip_distance = trip.distance; 
    const trip_duration = trip.formattedDuration;

    // Calculate trip amount
    const distance = convertCurrencyStringToNumber(trip_distance);
    const ratePerKm = parseFloat(cab.rate_per_km);
    const trip_amount = `₹ ${(distance * ratePerKm).toFixed(2)}`; // Format as string

    // Format the current time
    const date = new Date();
    const options = { hour: '2-digit', minute: '2-digit', hour12: true };
    const current_time = date.toLocaleTimeString('en-US', options);

    const user_name = `${user.firstName} ${user.lastName}`;

    user.on_going_ride_model="Ride";
    await user.save();

    // Create a base object for the ride request
    const baseRideRequest = {
      current_time: current_time.toString(),
      user_name: user_name.toString(),
      user_phone:user.mobileNumber.toString(),
      trip_distance: trip_distance, 
      trip_duration: trip_duration, 
      trip_amount: trip_amount, 
      pickup_address: pickup_address.toString(),
      pickup_lat: pickup_lat.toString(),
      pickup_lng: pickup_lng.toString(),
      drop_address: drop_address.toString(),
      drop_lat: drop_lat.toString(),
      drop_lng: drop_lng.toString(),
      is_transport_ride: false,
      userId: userId,
      on_going_ride_model:"Ride",
      reciever_number: "",
      reciever_name: "",
      goods_type: [],
      transport_type: "",
    };

    // Create a new ride request
    const ride = new Ride(baseRideRequest);
    ride.status = "Pending";
    ride.booking_date = new Date();
    const savedRide = await ride.save();

    // Calculate distances and times for each driver and filter by distance
    const driversWithDetails = await Promise.all(driverDetails.map(async (driver) => {
      const driverLocation = { latitude: driver.location.coordinates[0], longitude: driver.location.coordinates[1] };
      const pickupLocation = { latitude: pickup_lat, longitude: pickup_lng };
      const distance = geolib.getDistance(driverLocation, pickupLocation);

      if (distance < 10000) { // Filter drivers within 10km (10000 meters)
        // Calculate pickup time for this driver
        const pickupTime = await calculatePickupTime(driverLocation.latitude, driverLocation.longitude, pickup_lat, pickup_lng);
        const pickup_distance = pickupTime.distance; 
        const pickup_duration = pickupTime.formattedDuration; 

        return { ...driver.toObject(), distance, pickup_distance, pickup_duration };
      }
      return null;
    }));

    // Remove null entries from the list
    const filteredDrivers = driversWithDetails.filter(driver => driver !== null);

    // Sort drivers by distance (nearest first)
    filteredDrivers.sort((a, b) => a.distance - b.distance);

    // Function to emit ride request to the next driver in the list
    const emitToDriver = async (index) => {
      if (index >= filteredDrivers.length) {
        // console.log('All drivers have been notified or no driver is available.');
        await Ride.findByIdAndUpdate(savedRide._id, {
          isSearching: false
        }, { new: true });
        return;
      }

      const driver = filteredDrivers[index];
      const rideRequest = {
        ...baseRideRequest,
        pickup_distance: driver.pickup_distance,
        pickup_duration: driver.pickup_duration,
        driverId: driver._id,
      };

      // Update the existing ride with new pickup location and duration
      await Ride.findByIdAndUpdate(savedRide._id, {
        pickup_distance: driver.pickup_distance,
        pickup_duration: driver.pickup_duration,
        driverId: driver._id
      }, { new: true });

      io.to(driver.socketId).emit('ride-request', { ride_id: savedRide._id, ...rideRequest });
      //  io.emit('ride-request', { ride_id: savedRide._id, ...rideRequest });
      // Set a timeout to check the ride status and re-emit if not accepted
      setTimeout(async () => {
        const updatedRide = await Ride.findById(savedRide._id).exec();
        if (updatedRide && updatedRide.status_accept === false && updatedRide.isSearching === true && updatedRide.status === "Pending") // if the ride is accepted by any driver, cancelled by user, or is ongoing then it wont be transmitted to the next driver
        {  
          emitToDriver(index + 1); // Move to the next driver
        }
      }, 20000); // 20 seconds
    };

    // Start emitting the request to the first driver
    emitToDriver(0);

    return savedRide._id;
  } catch (error) {
    console.error('Error triggering ride request:', error.message);
    throw new Error('Failed to trigger ride request');
  }
};

export const cancelRideRequest = async (io, user_id, ride_id)=>{

  try {

    // Find the customer and ride
    const customer = await UserModel.findById(user_id).exec();
    const ride = await Ride.findOne({ _id: ride_id, userId: user_id }).exec();
    const driver = await Driver.findById(ride.driverId);
    // Validation
    if (!customer) {
      return { status: false, message: 'Customer does not exist', data: {} };
    }
    if (!ride) {
      return { status: false, message: 'Ride is invalid or does not belong to this user', data: {} };
    }
    if (!driver) {
      return { status: false, message: 'Ride is invalid or does not belong to this driver', data: {} };
    }


    // Check if the ride can be cancelled
    if (ride.can_be_cancelled) {
      ride.isSearching = false;
      ride.status = "Cancelled"
      await ride.save();

        // Remove on_going_ride_id from driver
    await Driver.updateOne(
      { _id: ride.driverId },
      { $unset: { on_going_ride_id: "" } }
    );

         // Remove on_going_ride_id from customer
         await UserModel.updateOne(
          { _id: ride.userId },
          { $unset: { on_going_ride_id: "" } }
        );


      // socket emission to drivers of cancellation
      io.to(driver.socketId).emit('ride-request-cancel', { message: 'The ride has been cancelled by the user' });

      return 'Ride search is cancelled';
    } else {
      return 'Ride cannot be cancelled now';
    }
  } catch (error) {
    return { status: false, message: error, data: {} };
  }
};

export const completeRide = async (ride_id) => {
  try {
    // Fetch ride details and populate driverId with driver details
    const ride = await Ride.findById(ride_id).populate('driverId').exec();

    if (!ride) {
      throw new Error("Ride does not exist");
    }

    ride.status = "Completed";
    await ride.save();
    // Check if the driverId is populated correctly
    const driver = ride.driverId;

    if (!driver) {
      throw new Error("Driver details are not available");
    }

    // Prepare the response object
    const response = {
      driver_image: driver.profile_img || "https://images.unsplash.com/photo-1504620776737-8965fde5c079?q=80&w=2073&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      driver_name: `${driver.firstName} ${driver.lastName}`,
      pickup_address: ride.pickup_address,
      drop_address: ride.drop_address,
      trip_id: ride._id,
      vehicle_number: driver.vehicle_number,
      date_time_ride: formatDateTime(ride.startTime),
      trip_time: ride.trip_time, 
      extra_km_charge: ride.extra_km_charge,
      distance_travel: ride.trip_distance ,
      distance_fare: ride.trip_amount,
      total_amount: ride.total_amount, 
    };

    return response;
  } catch (error) {
    console.error(error);
    throw new Error('Failed to complete ride: ' + error.message);
  }
};