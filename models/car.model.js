import mongoose from 'mongoose';

const carSchema = new mongoose.Schema({
  car_name: {
    type: String,
    required: true,
  },
  rate_per_km: {
    type: Number,
    required: true,
  },
  tagline: String,

  licensePlate: String,
  
  car_type:String,
  
  image_url:String,
 
  category: String,

  ac:{
    type:Boolean
  },

  passenger_capacity:{
    type:Number
  },

  luggage_capacity:{
    type:String
  },
  car_size:{
    type:String
  },
  rating:{
    type:Number
  },
  total_ratings:{
    type:Number
  },
  extra_km_fare:{
    type:String
  },
  fuel_type:{
    type:String
  },
  cancellation_policy:{
    type:String
  },
  free_waiting_time:{
    type:String
  },

  extracharge:{
    fare_beyond_included_distance:{
      type:String
    },
    waiting_charges_beyond_free_time:{
      type:String
    },
    night_time_allowance:{
      type:String
    }
  },

inclusions:{
  included_kms:{
    type:String
  },
  pickup_drop:{
    type:String
  },
  state_taxes:{
    type:String
  },
  toll_charges:{
    type:String
  }
}


});

const Car = mongoose.model('Car', carSchema);

export default Car;
