import express from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import "dotenv/config";
import UserCollection from "../../models/user.js";

const loginRouter = express.Router();

loginRouter.post("/v2/user/login", async (req, res) => {
  try {
    // Extract user credentials from the request body
    const username = req.body.username;
    const password = req.body.password;

    // Validate Credentials
    if (!username || !password) {
      return res.status(401).send({
        status: "failed",
        error: "Credentials are required.",
      });
    }

    // find user by UserName
    let findUserQuery;
    findUserQuery = { username: username };
    console.log("user", findUserQuery);
    const dbUser = await UserCollection.findOne(findUserQuery);

    if (!dbUser) {
      return res.status(400).send({ error: "Invalid Credentials." });
    }

    // Check if the user is deleted
    if (dbUser.isDeleted == "true") {
      return res.status(400).send({ error: "User Account is not found." });
    }

    // Validate Password
    if (!(await bcrypt.compare(password, dbUser.password))) {
      return res.status(400).send({ error: "Invalid Credentials." });
    }

    // Create a JWT token

    const role = dbUser.role;

    if (role == "superadmin") {
      const email = dbUser.email;
      const username = dbUser.username;
      const jwtKey = "staysolve123";
      // Generate JWT
      const accessToken = jwt.sign({ email, username, role }, jwtKey);

      // Store the JWT token in a cookie named "jwtToken"
      res.cookie("jwtToken", accessToken, {
        // Cookie Expires in (10 hours) (milliseconds from now)
        maxAge: 110000 * 60 * 10,
        expires: new Date(Date.now() + 99999999),
        // Allow client-side JavaScript to access the cookie (false for testing, should be true in production)
        httpOnly: false,
      });

      // Send a response indicating successful login along with the JWT token
      return res.status(200).send({ message: "Login Success.", accessToken });
    } else {
      return res.status(200).send({ message: "Invalid Account." });
    }
  } catch (error) {
    console.error(error);
    res.status(400).send({ error: error.message });
  }
});

export default loginRouter;
