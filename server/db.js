const dns = require("node:dns");
dns.setServers(["8.8.8.8"]);

const mongoose = require("mongoose");
async function ConnectDB() {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 10000,
    });
    console.log(`MongoDB Connected: ${mongoose.connection.name}`);
  } catch (error) {
    console.log("MongoDB connection failed: ", error.message);
    throw error;
  }
}

module.exports = ConnectDB;
