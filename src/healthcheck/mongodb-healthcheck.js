import express from "express";
import dotenv from "dotenv";

dotenv.config();

const databaseRouter = express.Router();

databaseRouter.get("/v2/database/healthcheck", async (req, res) => {
  const response = {
    message: {
      okay: "Database health check okay!",
      database: process.env.DATABASE_CONNECTION || "DB CONNECTION Not Found",
      tokenSecret: process.env.SECRET_KEY || "Secret Not Found",
      all: process.env,
    },
  };
  return res.status(200).send({ response });
});

export default databaseRouter;
