import express from "express";
import dotenv from "dotenv";

dotenv.config();

const databaseRouter = express.Router();

databaseRouter.get("/v2/database/healthcheck", async (req, res) => {
  const response = {
    message: {
      okay: "Database health check okay!",
      database: process.env.DATABASE_CONNECTION || "not found",
    },
  };
  return res.status(200).send({ response });
});

export default databaseRouter;
