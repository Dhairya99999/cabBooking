import Booking from '../models/booking.model.js';

const getBookingHistory = async (userId) => {
  try {
    // Fetch all bookings for the user
    const bookings = await Booking.find({ user: userId });

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
        kmCovered: booking.kmCovered,
        amountPaid: booking.amountPaid,
        date: booking.date,
      })),
      ongoingAndCompletedBookings: ongoingAndCompletedBookings.map(booking => ({
        id: booking._id.toString(),
        status: booking.status,
        car_name: booking.car_name,
        car_image: booking.car_image,
        startLocation: booking.startLocation,
        endLocation: booking.endLocation,
        kmCovered: booking.kmCovered,
        amountPaid: booking.amountPaid,
        date: booking.date,
      })),
    };
  } catch (error) {
    throw new Error('Error fetching booking history: ' + error.message);
  }
};

export default getBookingHistory;
