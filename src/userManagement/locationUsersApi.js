import express from "express";
import dotenv from "dotenv";

import { truthyCheck } from "../utility/extensions.js";
import UserCollection from "../models/user.js";
import Location from "../models/location.js";
import { emailRegex } from "../utility/regex.js";
import authorization from "../services/authorizationMiddleware/authorization.js";
import { doesUserAlreadyExists } from "../utility/extensions.js";
import hashPassword from "../services/encryption/hashpassword.js";

dotenv.config();

const locationUsersRouter = express.Router();

/**
 * IN PROGRESS
 */
locationUsersRouter.get(
  "/v2/locationUsers",
  authorization,
  async (req, res) => {
    try {
      // Check IF Role in (SUPERADMIN, ORGADMIN)
      const role = req.role;

      if (!(role == "superadmin" || role == "organizationuser")) {
        res.status(403).send("Invalid Authorization.");
        return;
      }

      // If Id=All then SUPERADMIN requesting all users to display
      // If Id= Specific Org Id then get Users for that Org only.
      const locIdQuery = truthyCheck(req.query?.locationId);
      const orgIdQuery = truthyCheck(req.query?.organizationId);

      let locUsers = await UserCollection.aggregate([
        {
          $match: {
            role: "locationuser",
            userLocationId: locIdQuery,
          },
        },
        {
          $lookup: {
            from: "locations",
            localField: "userLocationId",
            foreignField: "locationId",
            as: "vw_loc_users",
          },
        },
        {
          $lookup: {
            from: "organizations",
            localField: "vw_loc_users.locationOrgId",
            foreignField: "organizationId",
            as: "vw_org_users",
          },
        },
      ]);

      return res.status(200).send({
        success: true,
        data: locUsers,
      });
      //}
    } catch (error) {
      console.log(
        "locationUsersRouter.get.v2.locationUsers Get Users.Error:",
        error
      );
      res.status(500).send({ status: "error", error });
    }
  }
);

/**
 * GOOD
 * POST: New Location User
 */
locationUsersRouter.post(
  "/v2/locationUser",
  authorization,
  async (req, res) => {
    try {
      if (req.role !== "superadmin" && req.role !== "organizationuser") {
        res.status(403).send("Invalid Authorization.");
        return;
      }

      const _userName = req.body.userName;
      const _password = req.body.password;
      const _confirmPassword = req.body.confirmPassword;

      const _role = "locationuser";
      let _userOrgId = req.body.organizationId;
      const _userLocId = req.body.locationId;

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
        _userLocId,
        _userOrgId,

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
          error: "Username is not available. Please choose different Username.",
        });
      }

      let _test = truthyCheck(_userOrgId);
      console.log("_test", _test);
      if (!_test) {
        const _orgs = await Location.find({
          locationId: _userLocId,
        });
        console.log("usr loc org", _orgs);
        _userOrgId = _orgs[0]?.locationOrgId;
      }

      // Save data in the database collection
      const orgUserData = new UserCollection({
        userName: _userName,
        password: _password,
        role: _role,

        userLocationId: _userLocId,
        userOrganizationId: _userOrgId,

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
        message: "Location User added Successfully",
        data: orgUserData,
      });
    } catch (error) {
      console.error(error);
      return res.status(400).send({ error: error.message });
    }
  }
);

/**
 * GOOD
 * PUT: Location User
 */
locationUsersRouter.put("/v2/locationUser", authorization, async (req, res) => {
  try {
    if (req.role !== "superadmin" && req.role !== "organizationuser") {
      res.status(403).send("Invalid Authorization.");
      return;
    }

    const _userName = req.body.userName;
    const _password = req.body.password;
    const _confirmPassword = req.body.confirmPassword;

    const _role = "locationuser";
    const _userLocId = req.body.locationId;

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
      _userLocId,

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
          userName: _userName,
          password: hashPassword(_password),

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
      message: "Location User updated Successfully",
      data: orgUserData,
    });
  } catch (error) {
    console.error(error);
    return res.status(400).send({ error: error.message });
  }
});
export default locationUsersRouter;
