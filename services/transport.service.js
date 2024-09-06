import Driver from "../models/driver.model.js";
import Category from "../models/category.model.js";
import transportRide from "../models/transport.ride.model.js";
import { UserModel } from "../models/user.model.js";
import axios from "axios";
import geolib from 'geolib';
import { calculateDistance, calculateFare } from "../utils/locationUtils.js";
import { formatDate } from "../utils/miscUtils.js";

function convertCurrencyStringToNumber(currencyString) {
  // Remove the currency symbol and any commas or spaces
  const numericString = currencyString.replace(/[^0-9.-]/g, '');
  // Convert to number
  return parseFloat(numericString);
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

// Helper function to parse duration string and return total minutes
function parseDuration(durationStr) {
  const hoursMatch = durationStr.match(/(\d+)\s*hour/);
  const minutesMatch = durationStr.match(/(\d+)\s*min/);
  
  const hours = hoursMatch ? parseInt(hoursMatch[1], 10) : 0;
  const minutes = minutesMatch ? parseInt(minutesMatch[1], 10) : 0;
  
  return (hours * 60) + minutes; // Total minutes
}

// Helper function to format time in "12-hour format with AM/PM"
function formatTime(date) {
  let hours = date.getHours();
  const minutes = date.getMinutes().toString().padStart(2, '0');
  const period = hours >= 12 ? 'PM' : 'AM';
  
  hours = hours % 12;
  hours = hours ? hours : 12; // The hour '0' should be '12'
  
  return `${hours}:${minutes} ${period}`;
}

  export const listAvailableTransportCategories = async (startLocation, endLocation) =>{

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

    const availableCategories = await Category.find({ category_type: { $in: ["transport", "both"] } }); // find cabs that are used for ride or for both transport and rides

    if(!availableCategories){
        return "No transport available";
    }
    
      // Calculate the distance between start and end locations once
  const distance = calculateDistance(startLocation, endLocation);

  // Prepare the list of cabs with calculated fare
  const transport_vehicles = availableCategories.map((category) => {
    const fare = calculateFare(category.rate_per_km, distance);
    const rounded_fare = Math.ceil(fare);
    return {
      id: category._id,
      transport_model: category.category_name,
      capacity_info: category.capacity_info,
      rate_per_km: `₹${category.rate_per_km}`,
      fare: `₹${rounded_fare}`, // Fare calculated based on distance and rate per km
      image_url :category.image_url,
    };
  });

  // Return a single distance value and the array of cabs
  return {
    distance: `${parseFloat(distance.toFixed(2))} Km`, // Distance in km, rounded to 2 decimal places
    transport_vehicles: transport_vehicles, // Array of transport vehicles
  };
};

export const getTransportVehicleDetails = async(startLat, startLng, endLat, endLng, vehicleId) => {

  const vehicleDetails = await Category.findById(vehicleId).exec();

  if(!vehicleDetails){
    throw "Vehicle does not exists"
  }
    
   // Fetch driver details related to the car
   const driverDetails = await Driver.findOne({ carDetails: vehicleId }).exec();

  //fetch geolocation
  const [startRoute, endRoute] = await Promise.all([
    getLocationName(startLat, startLng),
    getLocationName(endLat, endLng)
  ]);

  //calculate pickup time
  const pickupTime = await calculatePickupTime(driverDetails.location.coordinates[0], driverDetails.location.coordinates[1], startLat, startLng);
  const distance = await calculatePickupTime(startLat, startLng, endLat, endLng);

  // Parse pickup_duration to total minutes
  const pickupDurationInMinutes = parseDuration(pickupTime.formattedDuration);
  
  // Calculate the pickup time
  const currentTime = new Date();
  const pickupTimeDate = new Date(currentTime.getTime() + (pickupDurationInMinutes * 60 * 1000)); // Add duration in milliseconds
  const pickupTimeFormatted = formatTime(pickupTimeDate);

  // Calculate fare
  const fare = calculateFare(vehicleDetails.rate_per_km, parseFloat(distance.distance));

  const response = {
    current_date: formatDate(new Date()),
    pickup_duration: pickupTime.formattedDuration,
    pickup_time: pickupTimeFormatted,
    route: `${startRoute} - ${endRoute}`,
    vehicle_name: vehicleDetails.category_name,
    highlights: vehicleDetails.highlights,
    included_loading_time: vehicleDetails.inclusions.loading_time,
    distance: distance.distance,
    fare: `₹ ${fare.toFixed(2)}`,
    rounded_fare: `₹ ${Math.ceil(fare)}`,
    image:vehicleDetails.image_url
  };

   return response;
}

export const getGoodsTypes = async (category_id) =>{

  const category = await Category.findById(category_id).exec();

  // Check if the category exists
  if (!category) {
    throw "Category does not exist";
  }

  // Extract the goods_types array from the category
  const goodsTypes = category.goods_types;

 // Map goodsTypes to the response
 const response = goodsTypes.map((goods, index) => ({
  goods_id: index,
  goods_name: goods.name,
  goods_description: goods.description
}));



  return response;

}


export const triggerParcelRequest = async(io, reciever_name, reciever_mobileNumber, transport_type,pickup_address, drop_address, pickup_lat, pickup_lng, drop_lat, drop_lng, vehicle_id, userId, goods_type) =>{


   // Fetch user and cab details
   const user = await UserModel.findById(userId).exec();
   const cab = await Category.findById(vehicle_id).exec();
   const driverDetails = await Driver.find({
     carDetails: vehicle_id,         // Match drivers with specific category
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
     throw new Error ("You already have an existing ride");
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

   // Create a base object for the ride request
   const baseParcelRequest = {
     current_time: current_time.toString(),
     user_name: user_name.toString(),
     user_phone:user.mobileNumber.toString(),
     reciever_number:reciever_mobileNumber,
     reciever_name: reciever_name,
     goods_type:goods_type,
     transport_type: transport_type,
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

   const parcelRide = new transportRide(baseParcelRequest);
   parcelRide.status = 'Pending';
   parcelRide.booking_date = new Date();
   const savedParcelRide = await parcelRide.save();

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
        console.log('All drivers have been notified or no driver is available.');
        await transportRide.findByIdAndUpdate(savedParcelRide._id, {
          isSearching: false
        }, { new: true });
        return;
      }

      const driver = filteredDrivers[index];
      const parcelRequest = {
        ...baseParcelRequest,
        pickup_distance: driver.pickup_distance,
        pickup_duration: driver.pickup_duration,
        driverId: driver._id,
      };

      // Update the existing ride with new pickup location and duration
      await transportRide.findByIdAndUpdate(savedParcelRide._id, {
        pickup_distance: driver.pickup_distance,
        pickup_duration: driver.pickup_duration,
        driverId: driver._id
      }, { new: true });

      io.to(driver.socketId).emit('ride-request', { ride_id: savedParcelRide._id, ...parcelRequest });
  
      //  io.emit('ride-request', { ride_id: savedParcelRide._id, ...parcelRequest });
      // Set a timeout to check the ride status and re-emit if not accepted
      setTimeout(async () => {
        const updatedRide = await transportRide.findById(savedParcelRide._id).exec();
        if (updatedRide && updatedRide.status_accept === false && updatedRide.isSearching === true && updatedRide.status === "Pending") // if the ride is accepted by any driver, cancelled by user, or is ongoing then it wont be transmitted to the next driver
        {  
          emitToDriver(index + 1); // Move to the next driver
        }
      }, 20000); // 20 seconds
    };

    // Start emitting the request to the first driver
    emitToDriver(0);

    return savedParcelRide._id;

}