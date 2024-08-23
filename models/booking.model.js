import mongoose from 'mongoose';
import { UserModel } from './user.model.js';

const bookingSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: UserModel, 
    required: true,
  },
  car_name: {
    type: String,
    required: true,
  },
  car_image: {
    type: String,
    required: true,
  },
  startLocation: {
    type: String,
    required: true,
  },
  endLocation: {
    type: String,
    required: true,
  },
  kmCovered: {
    type: String,
    required: true,
  },
  amountPaid: {
    type: String,
    required: true,
  },
  date: {
    type: Date,
    default: Date.now,
  },
  status: {
    type: String,
    enum: ['CANCELLED', 'ONGOING', 'COMPLETED'],
    required: true,
  },
});

const Booking = mongoose.model('Booking', bookingSchema);

export default Booking;
