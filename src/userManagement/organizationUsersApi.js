/**
 * Org Users Api
 * GET | POST | PUT | DEL
 */
import express from "express";
import dotenv from "dotenv";

import uuid4 from "uuid4";

import shortCircuitEvaluation from "../utility/extensions.js";
import UserCollection from "../models/user.js";
import { emailRegex } from "../utility/regex.js";
import authorization from "../services/authorizationMiddleware/authorization.js";

dotenv.config();

const organizationUsersRouter = express.Router();

/**
 * Org User Api Health Check
 */
organizationUsersRouter.get(
  "/v2/organizationUsers",
  authorization,
  async (req, res) => {
    try {
      // Check IF Role in (SUPERADMIN, ORGADMIN)
      const role = req.role;

      if (!(role == "superadmin" || role == "organizationadmin")) {
        res.status(403).send("Authentication failed.");
        return;
      }

      // If Id=All then SUPERADMIN requesting all users to display
      // If Id= Specific Org Id then get Users for that Org only.
      const orgIdQuery = shortCircuitEvaluation(req.query?.organizationId);

      console.log();
      const orgUsers = await UserCollection.find({
        role: "organizationadmin",
        organizationid: orgIdQuery || { $ne: null },
      }).sort({ _id: -1 });

      return res.status(200).send({
        success: true,
        data: orgUsers,
      });
    } catch (error) {
      console.log(
        "organizationUsersApi.get.v2.organizationUser Get Users.Error:",
        error
      );
      res.status(500).send({ status: "error", error });
    }
  }
);

// API for adding organization user
organizationUsersRouter.post(
  "/v2/organizationUser",
  authorization,
  async (req, res) => {
    try {
      // if (req.role !== 'superadmin') {
      //     res.status(403).send("You don't have access");
      //     return;
      // }
      const organizationuserid = uuid4();
      const organizationId = req.body.organizationId;
      const firstname = req.body.firstname;
      const lastname = req.body.lastname;
      const email = req.body.email;
      const mobile_number = req.body.mobile_number;
      const password = req.body.password;
      const confirmPassword = req.body.confirmPassword;
      const username = req.body.username;

      // Verify the incoming data
      const requiredFields = [
        firstname,
        lastname,
        username,
        email,
        mobile_number,
        password,
        confirmPassword,
        organizationId,
      ];
      console.log(requiredFields);
      if (requiredFields.some((field) => !field)) {
        res.status(401).send({
          status: "failed",
          error: "Required field(s) missing.",
        });
        return;
      }

      // Validate email format
      if (!emailRegex.test(email)) {
        return res.status(401).send({
          status: "failed",
          error: "Invalid Email Address.",
        });
      }

      // Check if password contains uppercase, lowercase, special character, and number
      if (
        !/(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[^a-zA-Z0-9]).{8,}/.test(password)
      ) {
        return res.status(401).send({
          status: "failed",
          error: "Invalid Password complexity requirements.",
        });
      }

      // Check if new password matches confirm password
      if (password !== confirmPassword) {
        return res.status(400).send({ error: "Passwords do not match." });
      }

      if (await doesUserAlreadyExists([UserCollection], "username", username)) {
        return res.status(400).send({
          error: "Username is not available. Please choose different Username.",
        });
      }

      let fileUrl = "";
      let is_default = true;
      // Save data in the database collection
      const orgUserData = new UserCollection({
        organizationuserid,
        organizationid: organizationId,
        firstname,
        lastname,
        email,
        mobile_number,
        password,
        username,
        fileUrl,
        role: "organizationuser",
        is_default,
        is_verified: true,
      });

      await orgUserData.save();

      res.status(201).send({
        message: "Organization User added Successfully",
        data: orgUserData,
      });
    } catch (error) {
      console.error(error);
      return res.status(400).send({ error: error.message });
    }
  }
);

/**
 * Help function: doesUserAlreadyExists
 * @param collections
 * @param field
 * @param value
 * @returns
 */
async function doesUserAlreadyExists(collections, field, value) {
  for (const collection of collections) {
    const existingRecord = await collection.findOne({ [field]: value });
    if (existingRecord) {
      return true;
    }
  }
  return false;
}

export default organizationUsersRouter;
