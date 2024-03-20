import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const databaseConnection =
  "mongodb+srv://staysolveadmin:qA9FyrjXJt*Er2$@stay-solve-database.sni6cfi.mongodb.net/stay-solve-backend";

const databaseRouter = express.Router();

databaseRouter.get("/v2/database/healthcheck", async (req, res) => {
  res.send("connectionUrl: " + process.env.DATABASE_CONNECTION);
});

export default databaseRouter;
