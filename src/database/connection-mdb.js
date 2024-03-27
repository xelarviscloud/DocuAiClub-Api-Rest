import dotenv from "dotenv";
import mongoose from "mongoose";

dotenv.config();

const databaseConnection = process.env.DATABASE_CONNECTION;

mongoose
  .connect(databaseConnection)
  .then(() => {
    console.log("MongoDB database connected successfully");
  })
  .catch((error) => {
    console.error("Error connecting to the database");
    console.error(error);
  });
