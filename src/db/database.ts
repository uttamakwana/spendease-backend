import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017";
const DB_NAME = "spendease-db";

export const connectToDb = async () => {
  try {
    const db = await mongoose.connect(`${MONGODB_URI}/${DB_NAME}`);
    console.log("Database connection established!");
    console.log("Database Name:", db.connection.name);
    console.log("Database Host:", db.connection.host);
  } catch (error) {
    console.error("Error connecting to MongoDB: ", error);
  }
};
