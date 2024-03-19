import express from "express";
import jwt from "jsonwebtoken";
import cookieParser from "cookie-parser";
import 'dotenv/config';

// Create an instance of an Express Router
const app = express.Router();

// Use the cookie-parser middleware
app.use(cookieParser());

// Authentication middleware
const authorization = (req, res, next) => {
    try {
        const authorizationHeader = req.headers.authorization;
        const postmanToken = req.cookies.jwtToken;

        let token = authorizationHeader?.replace("jwtToken=", "").trim();
        token = token || postmanToken?.trim();

        if (!token) {
            return res.status(403).send("Please Login First");
        }

        const tokenData = jwt.verify(token, process.env.SECRET_KEY);

        req.email = tokenData.email;
        req.username = tokenData.username
        req.role = tokenData.role;

        return next();
    } catch (error) {
        return res.sendStatus(403);
    }
};

// Export the authorization middleware for use in other parts of the application
export default authorization;