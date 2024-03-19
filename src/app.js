import express from "express";
import dotenv from "dotenv";
import "dotenv/config";
import cors from "cors";
import bodyParser from "body-parser";
import cookieParser from "cookie-parser";
import jwt from "jsonwebtoken";

import loginRouter from "./authentication/login/userLoginApi.js";
import databaseRouter from "./healthcheck/mongodb-healthcheck.js";

// configuration of .env file
dotenv.config();

// configuration server express
const app = express();

const corsOptions = {
  //To allow requests from client
  origin: [
    "http://localhost:3001",
    "http://localhost:3000",
    "http://localhost:3002",
    "http://localhost:3003",
    "http://localhost:3004",
    "http://localhost:3005",
    "http://localhost:4000",
    "http://192.168.29.29:4000",
    "http://192.168.29.29:3000",
    "http://192.168.29.29:3001",
    "http://192.168.29.189:3002",
    "http://192.168.29.29:3003",
    "http://192.168.29.29:3002",
    "http://44.202.32.14",
    "http://54.162.14.61",
  ],
  credentials: true,
  exposedHeaders: ["set-cookie"],
  methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
  allowedHeaders: [
    "Origin",
    "X-Requested-With",
    "Content-Type",
    "Accept",
    "set-cookie",
    "Access-Control-Allow-Origin",
    "Cookie",
    "cookie",
    "set-cookie",
    "Authorization",
    "Referer",
    "User-Agent",
    "Accept-Encoding",
    "Accept-Language",
    "Connection",
    "Host",
    "Origin",
  ],
};

app.use(cors(corsOptions));

app.use(cors());

// Adjust the limit for handling request bodies
app.use(bodyParser.json({ limit: "20mb" }));
app.use(bodyParser.urlencoded({ limit: "20mb", extended: true }));

app.use(express.json());

app.use(cookieParser());

// add Api Routers
app.use(loginRouter);
app.use(databaseRouter);
//app.use(organizationRouter);

const port = process.env.PORT || 3000;
// health check
app.get("/", async (req, res) => {
  res.send(
    "Base Path: API is running." +
      "Process Port:" +
      process.env.PORT +
      ";" +
      "default Port:" +
      port
  );
});

//verify the logging token
app.get("/v2/auth/is_logged_in", async (req, res) => {
  try {
    const token = req.cookies.jwtToken;

    if (!token) {
      return res.json(false);
    }
    const isValidToken = await jwt.verify(token, "staysolve123");

    if (isValidToken) {
      return res.json(true);
    } else {
      return res.json(false);
    }
  } catch (error) {
    return res.json(false);
  }
});

app.listen(port, () => {
  console.log(`Server is running on port-- ${port}`);
});
