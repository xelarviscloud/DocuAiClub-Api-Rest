import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const databaseConnection = process.env.DATABASE_CONNECTION;

const databaseRouter = express.Router();

databaseRouter.get("/v2/database/healthcheck", async (req, res) => {
  res.send("connectionUrl: " + databaseConnection);
});

export default databaseRouter;
