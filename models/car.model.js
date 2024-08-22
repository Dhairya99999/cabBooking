import mongoose from 'mongoose';

const carSchema = new mongoose.Schema({
  model: {
    type: String,
    required: true,
  },
  rate_per_km: {
    type: Number,
    required: true,
  },
  tagline: String,
  licensePlate: String,
  type:String,
  imageUrl:String,
});

const Car = mongoose.model('Car', carSchema);

export default Car;
