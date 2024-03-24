import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const databaseConnection =
  // "mongodb+srv://staysolveadmin:qA9FyrjXJt*Er2$@stay-solve-database.sni6cfi.mongodb.net/stay-solve-backend";
  "mongodb+srv://hitesh:hitesh@cluster0.gkpowom.mongodb.net/StaySolveDocuAiDB?retryWrites=true&w=majority&appName=Cluster0";
mongoose
  .connect(databaseConnection)
  .then(() => {
    console.log("MongoDB database connected successfully");
  })
  .catch((error) => {
    console.error("Error connecting to the database");
    console.error(error);
  });
