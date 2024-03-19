import mongoose from "mongoose";
import dotenv from "dotenv";

// Configure environment variables
dotenv.config();

const databaseConnection = process.env.DATABASE_CONNECTION;

// DB connection function
mongoose
  .connect(databaseConnection)
  .then(() => {
    console.log("MongoDB database connected successfully");
  })
  .catch((error) => {
    console.error("Error connecting to the database");
    console.error(error);
  });
