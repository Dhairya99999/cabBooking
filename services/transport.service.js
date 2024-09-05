import Driver from "../models/driver.model.js";
import Category from "../models/category.model.js";
import transportRide from "../models/transport.ride.model.js";
import { UserModel } from "../models/user.model.js";
import axios from "axios";
import geolib from 'geolib';
import { calculateDistance, calculateFare } from "../utils/locationUtils.js";

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

    return {
      id: category._id,
      transport_model: category.category_name,
      capacity_info: category.capacity_info,
      rate_per_km: `₹${category.rate_per_km}`,
      fare: `₹${parseFloat(fare.toFixed(2))}`, // Fare calculated based on distance and rate per km
      image_url :category.image_url,
    };
  });

  // Return a single distance value and the array of cabs
  return {
    distance: `${parseFloat(distance.toFixed(2))} Km`, // Distance in km, rounded to 2 decimal places
    transport_vehicles: transport_vehicles, // Array of transport vehicles
  };
};

