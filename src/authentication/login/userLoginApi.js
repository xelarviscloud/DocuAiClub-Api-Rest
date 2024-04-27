import bcrypt from "bcrypt";
import "dotenv/config";
import jwt from "jsonwebtoken";
import UserCollection from "../../database/models/user.js";
import OrganizationCollection from "./../../database/models/organization.js";

import authorization from "../../services/authorizationMiddleware/authorization.js";
import hashPassword from "../../services/encryption/hashPassword.js";

import {
  doesUserAlreadyExists,
  sendErrorResponse,
} from "../../utility/extensions.js";

import multer from "multer";

import dotenv from "dotenv";
import express from "express";

dotenv.config();

const formDataMulter = multer().none();

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
    findUserQuery = { userName: username };

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
    const organizationId = dbUser.userOrganizationId;

    const orgs = await OrganizationCollection.find({
      organizationId: organizationId,
    });

    const userOrganization = orgs[0];

    if (
      role == "superadmin" ||
      role == "organizationuser" ||
      role == "locationuser"
    ) {
      const userId = dbUser._id;
      const emailAddress = dbUser.emailAddress;
      const userName = dbUser.userName;
      const locationId = dbUser.userLocationId;
      const firstName = dbUser.firstName;
      const lastName = dbUser.lastName;
      const phoneNumber = dbUser.phoneNumber;

      const jwtKey = "staysolve123";

      let roleDescription = "";
      switch (dbUser.role) {
        case "locationuser":
          roleDescription = "Property Manager";
          break;
        case "organizationuser":
          roleDescription = "Organization Admin";
          break;
        case "superadmin":
          roleDescription = "System Admin";
          break;
        default:
          roleDescription = "";
          break;
      }
      // Generate JWT
      const accessToken = jwt.sign(
        {
          email,
          userName,
          userId,
          role,
          firstName,
          lastName,
          organizationId,
          locationId,
          userOrganization,
          roleDescription,
          emailAddress,
          phoneNumber,
        },
        jwtKey
      );

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

loginRouter.post(
  "/v2/user/changePassword",
  formDataMulter,
  authorization,
  async (req, res) => {
    try {
      // Extract user credentials from the request body
      const _username = req.body.username;
      const _currentPassword = req.body.currentPassword;
      const _newPassword = req.body.newPassword;
      const _newConfirmedPassword = req.body.newConfirmedPassword;

      // Validate Credentials
      if (
        !_username ||
        !_currentPassword ||
        !_newPassword ||
        !_newConfirmedPassword
      ) {
        return res.status(401).send({
          status: "failed",
          error: "Invalid Password Information.",
        });
      }

      const dbUser = await UserCollection.findOne({ userName: _username });

      if (!dbUser) {
        return res.status(400).send({ error: "Invalid Credentials." });
      }

      // Check if the user is deleted
      if (dbUser.isDeleted == "true") {
        return res.status(400).send({ error: "User Account is not found." });
      }

      if (_newPassword !== _newConfirmedPassword) {
        return res.status(400).send({ error: "Invalid Passwords." });
      }
      // Validate Password
      if (!(await bcrypt.compare(_currentPassword, dbUser.password))) {
        return res.status(400).send({ error: "Invalid Credentials." });
      }

      // Save data in the database collection
      const userData = await UserCollection.updateOne(
        { userName: _username },
        {
          $set: {
            password: hashPassword(_newPassword),
            updatedAt: new Date(),
          },
        }
      );

      return res
        .status(200)
        .send({ message: "Password Updated Successfully." });
    } catch (error) {
      console.error(error);
      res.status(400).send({ error: error.message });
    }
  }
);

loginRouter.put(
  "/v2/user/updateProfile",
  formDataMulter,
  authorization,
  async (req, res) => {
    try {
      if (
        req.role !== "superadmin" &&
        req.role !== "organizationuser" &&
        req.role !== "locationuser"
      ) {
        res.status(403).send("Invalid Authorization.");
        return;
      }

      const _userName = req.body.userName;

      const _firstName = req.body.firstName;
      const _lastName = req.body.lastName;
      const _emailAddress = req.body.emailAddress;
      const _phoneNumber = req.body.phoneNumber;
      const _fileUrl = req.body.fileUrl;

      // Verify the incoming data
      const requiredFields = [
        _userName,
        _firstName,
        _lastName,
        _emailAddress,
        _phoneNumber,
      ];

      if (requiredFields.some((field) => !field)) {
        res.status(401).send({
          status: "failed",
          error: "Required field(s) missing.",
        });
        return;
      }

      // Validate email format
      if (!emailRegex.test(_emailAddress)) {
        return res.status(401).send({
          status: "failed",
          error: "Invalid Email Address.",
        });
      }

      if (
        !(await doesUserAlreadyExists([UserCollection], "userName", _userName))
      ) {
        return res.status(400).send({
          error: "Invalid Username.",
        });
      }

      const userData = await UserCollection.updateOne(
        { userName: _userName },
        {
          $set: {
            firstName: _firstName,
            lastName: _lastName,
            emailAddress: _emailAddress,
            phoneNumber: _phoneNumber,

            fileUrl: _fileUrl,
            updatedAt: new Date(),
          },
        }
      );

      res.status(201).send({
        message: "User updated Successfully",
        data: userData,
      });
    } catch (error) {
      return sendErrorResponse(res, error);
    }
  }
);

export default loginRouter;
