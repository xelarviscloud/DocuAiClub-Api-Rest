import express from "express";
import dotenv from "dotenv";

dotenv.config();

const databaseRouter = express.Router();

databaseRouter.get("/v2/database/healthcheck", async (req, res) => {
  //res.send("connectionUrl: " + process.env.DATABASE_CONNECTION);
  res.send({ Message: "database health check okay!" });
});

export default databaseRouter;
