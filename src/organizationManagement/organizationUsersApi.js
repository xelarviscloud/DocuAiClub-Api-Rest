/**
 * Org Users Api
 * GET | POST | PUT | DEL
 */
import dotenv from "dotenv";
import express from "express";

import UserCollection from "../database/models/user.js";
import authorization from "../services/authorizationMiddleware/authorization.js";
import hashPassword from "../services/encryption/hashPassword.js";
import {
  doesUserAlreadyExists,
  truthyCheck,
  sendErrorResponse,
} from "../utility/extensions.js";
import { emailRegex } from "../utility/regex.js";
import multer from "multer";
dotenv.config();

const formDataMulter = multer().none();

const organizationUsersRouter = express.Router();

/**
 * GOOD
 * GET: All Users
 * IF ORG ID THen Get ORG Users
 * IF NO ORG ID Then SUPER ADMIN, GET All ORG USERS
 */
organizationUsersRouter.get(
  "/v2/organizationUsers",
  authorization,
  async (req, res) => {
    try {
      // Check IF Role in (SUPERADMIN, ORGADMIN)
      const role = req.role;

      if (!(role == "superadmin" || role == "organizationuser")) {
        res.status(403).send("Authentication failed.");
        return;
      }

      // If Id=All then SUPER ADMIN requesting all users to display
      // If Id= Specific Org Id then get Users for that Org only.
      const orgIdQuery = truthyCheck(req.query?.organizationId);

      const orgUsers = await UserCollection.aggregate([
        {
          $match: {
            role: "organizationuser",
            userOrganizationId: orgIdQuery || { $ne: null },
          },
        },
        {
          $lookup: {
            from: "organizations",
            localField: "userOrganizationId",
            foreignField: "organizationId",
            as: "vw_org_users",
          },
        },
      ]);

      // .find({
      //   role: "organizationadmin",
      //   organizationid: orgIdQuery || { $ne: null },
      // })
      // .sort({ _id: -1 });

      return res.status(200).send({
        success: true,
        data: orgUsers,
      });
    } catch (error) {
      return sendErrorResponse(res, error);
    }
  }
);

/**
 * GOOD
 */
organizationUsersRouter.post(
  "/v2/organizationUser",
  formDataMulter,
  authorization,
  async (req, res) => {
    try {
      if (req.role !== "superadmin") {
        res.status(403).send("Authentication failed.");
        return;
      }

      const _userName = req.body.userName;
      const _password = req.body.password;
      const _confirmPassword = req.body.confirmPassword;

      const _role = "organizationuser";
      const _userOrgId = req.body.organizationId;

      const _firstName = req.body.firstName;
      const _lastName = req.body.lastName;
      const _emailAddress = req.body.emailAddress;
      const _phoneNumber = req.body.phoneNumber;
      const _fileUrl = req.body.fileUrl;

      // Verify the incoming data
      const requiredFields = [
        _userName,
        _password,
        _confirmPassword,

        _role,
        _userOrgId,

        _firstName,
        _lastName,
        _emailAddress,
        _phoneNumber,
      ];
      console.log("Required Fields", req.body);
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

      // Check if password contains uppercase, lowercase, special character, and number
      if (
        !/(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[^a-zA-Z0-9]).{8,}/.test(_password)
      ) {
        return res.status(401).send({
          status: "failed",
          error: "Invalid Password complexity requirements.",
        });
      }

      // Check if new password matches confirm password
      if (_password !== _confirmPassword) {
        return res.status(400).send({ error: "Passwords do not match." });
      }

      if (
        await doesUserAlreadyExists([UserCollection], "userName", _userName)
      ) {
        return res.status(400).send({
          error: "User already exist. Please choose a different Username.",
        });
      }

      const orgUserData = new UserCollection({
        userName: _userName,
        password: _password,
        userOrganizationId: _userOrgId,
        role: _role,

        firstName: _firstName,
        lastName: _lastName,
        emailAddress: _emailAddress,
        phoneNumber: _phoneNumber,

        fileUrl: _fileUrl,
        is_verified: true,
        createdAt: new Date(),
      });

      await orgUserData.save();

      res.status(201).send({
        message: "Organization User added Successfully",
        data: orgUserData,
      });
    } catch (error) {
      return sendErrorResponse(res, error);
    }
  }
);

/**
 * GOOD
 */
organizationUsersRouter.put(
  "/v2/organizationUser",
  formDataMulter,
  authorization,
  async (req, res) => {
    try {
      if (req.role !== "superadmin") {
        res.status(403).send("Authentication failed.");
        return;
      }

      const _userName = req.body.userName;
      const _password = req.body.password;
      const _confirmPassword = req.body.confirmPassword;

      const _role = "organizationuser";
      const _userOrgId = req.body.organizationId;

      const _firstName = req.body.firstName;
      const _lastName = req.body.lastName;
      const _emailAddress = req.body.emailAddress;
      const _phoneNumber = req.body.phoneNumber;
      const _fileUrl = req.body.fileUrl;

      // Verify the incoming data
      const requiredFields = [
        _userName,
        _password,
        _confirmPassword,

        _role,
        _userOrgId,

        _firstName,
        _lastName,
        _emailAddress,
        _phoneNumber,
      ];
      console.log("Required Fields", req.body);
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

      // Check if password contains uppercase, lowercase, special character, and number
      if (
        !/(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[^a-zA-Z0-9]).{8,}/.test(_password)
      ) {
        return res.status(401).send({
          status: "failed",
          error: "Invalid Password complexity requirements.",
        });
      }

      // Check if new password matches confirm password
      if (_password !== _confirmPassword) {
        return res.status(400).send({ error: "Passwords do not match." });
      }

      if (
        !(await doesUserAlreadyExists([UserCollection], "userName", _userName))
      ) {
        return res.status(400).send({
          error: "Invalid Username.",
        });
      }

      // Save data in the database collection
      const orgUserData = await UserCollection.updateOne(
        { userName: _userName },
        {
          $set: {
            password: hashPassword(_password),
            role: _role,

            firstName: _firstName,
            lastName: _lastName,
            emailAddress: _emailAddress,
            phoneNumber: _phoneNumber,

            fileUrl: _fileUrl,
            is_verified: true,
            createdAt: new Date(),
          },
        }
      );

      res.status(201).send({
        message: "Organization User updated Successfully",
        data: orgUserData,
      });
    } catch (error) {
      return sendErrorResponse(res, error);
    }
  }
);

export default organizationUsersRouter;
