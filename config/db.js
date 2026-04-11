const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
    });
    console.log(`MongoDB connected: ${conn.connection.host}`);
    return true;
  } catch (err) {
    console.error('⚠ MongoDB connection failed:', err.message);
    console.error('⚠ Server will start without database. API calls requiring DB will fail.');
    console.error('⚠ Set MONGODB_URI in .env to a valid MongoDB Atlas URI to connect.');
    return false;
  }
};

module.exports = connectDB;
