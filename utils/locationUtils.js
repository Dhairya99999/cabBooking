export const calculateDistance = (location1, location2) => {
  const toRadians = (degree) => degree * (Math.PI / 180);

  const lat1 = location1.startLat; // Use startLat for the start location
  const lon1 = location1.startLng; // Use startLng for the start location
  const lat2 = location2.endLat; // Use endLat for the end location
  const lon2 = location2.endLng; // Use endLng for the end location

  const R = 6371; // Earth's radius in kilometers
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  return distance; // Distance in km
};

  
  export const calculateFare = (ratePerKm, distance) => {
    return ratePerKm * distance;
  };
  