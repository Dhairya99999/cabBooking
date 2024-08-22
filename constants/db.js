import mongoose from "mongoose";

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 30000,  // Increase timeout to 30 seconds
      dbName: "cabBookingDB",
    });
    console.log("MongoDB Connected: " + mongoose.connection.host);
  } catch (error) {
    console.error("MongoDB connection error: ", error.message);
    process.exit(1);  // Exit the process with failure
  }
};

export default connectDB;
