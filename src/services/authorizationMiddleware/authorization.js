import express from "express";
import jwt from "jsonwebtoken";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";

dotenv.config();

const app = express.Router();

// Use the cookie-parser middleware
app.use(cookieParser());

/**
 * Authorization Middleware
 * @param {} req
 * @param {*} res
 * @param {*} next
 * @returns
 */
const authorization = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const jwtTokenFromCookie = req.cookies.jwtToken;
    let token = authHeader?.replace("token ", "").trim();
    token = token || jwtTokenFromCookie?.trim();

    if (!token) {
      return res.status(403).send("Invalid Token.");
    }

    // Verify JWT token, and assign attributes
    const tokenData = jwt.verify(token, process.env.SECRET_KEY);

    req.email = tokenData.email;
    req.username = tokenData.username;
    req.role = tokenData.role;

    return next();
  } catch (error) {
    return res.status(403).send({ message: error });
  }
};

export default authorization;
