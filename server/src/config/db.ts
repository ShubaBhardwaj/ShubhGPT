import mongoose from "mongoose";
import dns from "dns";

// Fix Node.js DNS SRV resolution timeouts (querySrv ETIMEOUT) on MongoDB Atlas connections
dns.setServers(["8.8.8.8", "1.1.1.1", "8.8.4.4"]);

const DBConnect = async () => {
  try {
    await mongoose.connect(process.env.MONGO_DB_URI as string, {
      serverSelectionTimeoutMS: 15000,
    });
    console.log(`MongoDB connected`);
  } catch (error) {
    console.error(`MongoDB connection error:`, error);
    throw error;
  }
};

export default DBConnect;

