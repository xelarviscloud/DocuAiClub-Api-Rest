import mongoose from "mongoose";
import dotenv from "dotenv";

// Configure environment variables
dotenv.config();

const databaseConnection =
  "mongodb+srv://staysolveadmin:qA9FyrjXJt*Er2$@stay-solve-database.sni6cfi.mongodb.net/stay-solve-backend";

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
