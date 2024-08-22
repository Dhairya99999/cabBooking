import mongoose from 'mongoose';
import Car from './car.model.js';  

const driverSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  carDetails: {
    type: mongoose.Schema.Types.ObjectId,
    ref: Car,  
    required: true,
  },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      required: true,
    },
    coordinates: {
      type: [Number],
      required: true,
    },
  },
  isAvailable: {
    type: Boolean,
    default: true,
  },
});

driverSchema.index({ location: '2dsphere' });

const Driver = mongoose.model('Driver', driverSchema);

export default Driver;
