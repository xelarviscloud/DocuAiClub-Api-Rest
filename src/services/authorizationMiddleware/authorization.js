import express from "express";
import jwt from "jsonwebtoken";
import cookieParser from "cookie-parser";
import "dotenv/config";

// Create an instance of an Express Router
const app = express.Router();

// Use the cookie-parser middleware
app.use(cookieParser());

// Authentication middleware
const authorization = (req, res, next) => {
  try {
    const authorizationHeader = req.headers.authorization;
    const postmanToken = req.cookies.jwtToken;
    console.log("test token", authorizationHeader, postmanToken);
    let token = authorizationHeader?.replace("Bearer ", "").trim();
    token = token || postmanToken?.trim();

    if (!token) {
      return res.status(403).send("Invalid Token.");
    }

    const tokenData = jwt.verify(token, "staysolve123");

    req.email = tokenData.email;
    req.username = tokenData.username;
    req.role = tokenData.role;

    return next();
  } catch (error) {
    return res.status(403).send({ message: error });
  }
};

// Export the authorization middleware for use in other parts of the application
export default authorization;
