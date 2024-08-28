import mongoose from 'mongoose';

const driverSchema = new mongoose.Schema({
  firstName : {
    type:String,
    required :true
  },
  lastName :{
    type:String,
    required: true
  },
  fullName: {
    type: String,
    required: true,
  },
  carDetails: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Car',  
    required: true,
  },
  location: {
    type: {
      type: String,
      enum: ['Point'],
    },
    coordinates: {
      type: [Number],
    },
  },
  isAvailable: {
    type: Boolean,
    default: true,
  },
  isVerified:{
    type:Boolean
  },
  driver_rating:{
    type:String
  },
  additional_information:[{
    type:String
  }],
  verification_text:{
    type:String
  },
  socketId: { type: String, required: false } 
});

driverSchema.index({ location: '2dsphere' });

const Driver = mongoose.model('Driver', driverSchema);

export default Driver;
