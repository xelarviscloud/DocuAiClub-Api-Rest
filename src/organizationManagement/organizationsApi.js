/**
 * CRUD ORG OPERATION
 *
 * GET:ALL
 * GET:detail:id
 * POST: body
 * PUT: body << soft delete is via PUT
 * DELETE: Id << dont implement right now
 */
import express from "express";
import Organization from "../models/organization.js"; // Importing the Organization model
import uuid4 from "uuid4";
import authorization from "../services/authorizationMiddleware/authorization.js";
import { calculatePagination } from "../services/pagination/paginationFunction.js";
import { emailRegex, phoneRegex } from "../utility/regex.js";
import { SearchFilter } from "../services/searching/searchingFilters.js";

const organizationRouter = express.Router();

/**
 * Org Health Check
 */
organizationRouter.get("/v2/organization", async (req, res) => {
  return res.status(200).send({
    Message: "Organization Controller - running okay!",
  });
});

/**
 * POST AUTH Check
 */
organizationRouter.post(
  "/v2/organization/authtest",
  authorization,
  async (req, res) => {
    return res.status(200).send({
      Message: req.headers.authorization,
    });
  }
);

/**
 * POST: Add New Org
 */
organizationRouter.post(
  "/v2/organization/add",
  authorization,
  async (req, res) => {
    try {
      // Extract organization data from request body
      const _orgName = req.body.organizationName;
      const _phoneNumber = req.body.phoneNumber;
      const _emailAddress = req.body.emailAddress;
      const _addLine1 = req.body.addressLine1;
      const _addLine2 = req.body.addressLine2;
      const _state = req.body.state;
      const _city = req.body.city;
      const _zipCode = req.body.zipCode;
      const _notes = req.body.notes;

      // Verify the incoming data
      if (
        !_orgName ||
        !_phoneNumber ||
        !_emailAddress ||
        !_addLine1 ||
        !_state ||
        !_city ||
        !_zipCode
      ) {
        return res.status(400).json({
          status: "failed",
          error: "Please provide all required fields",
        });
      }

      // Validate email format
      if (!emailRegex.test(_emailAddress)) {
        return res.status(400).json({
          status: "failed",
          error: "Invalid Email Address.",
        });
      }

      if (!phoneRegex.test(_phoneNumber)) {
        return res.status(400).json({
          status: "failed",
          error: "Invalid Phone Number.",
        });
      }

      // Save data in the database Organization collection
      const dbReadyObject = new Organization({
        organizationId: uuid4(),
        organizationName: _orgName,
        phoneNumber: _phoneNumber,
        emailAddress: _emailAddress,
        addressLine1: _addLine1,
        addressLine2: _addLine2,
        state: _state,
        city: _city,
        zipCode: _zipCode,
        notes: _notes,
      });

      await dbReadyObject.save(); // Saving organization data

      // Return success response
      res.status(201).json({
        status: "success",
        message: "Organization added successfully",
        organization: dbReadyObject,
      });
    } catch (error) {
      // Handle any errors
      console.error("Error:", error);
      res
        .status(500)
        .json({ status: "failed", error: "Internal server error" });
    }
  }
);

/**
 * GET All Orgs
 */
organizationRouter.get("/v2/organization/get", async (req, res) => {
  try {
    // Calculate page and pageSize using the function
    const { page, pageSize, skip } = calculatePagination(req);
    const search = req.query.search || "";
    const searchFilter = SearchFilter(search);

    /**
     * GET Orgs by Search Criteria
     */
    const organizationsData = await Organization.find(searchFilter)
      .sort({ _id: -1 })
      .skip(skip)
      .limit(pageSize);

    // Count total documents matching the search filter for pagination
    const totalDocuments = await Organization.countDocuments(searchFilter);

    // Send response with organizations data and pagination information
    return res.status(200).send({
      success: true,
      data: organizationsData,
      currentPage: page,
      pageSize,
      totalPages: Math.ceil(totalDocuments / pageSize),
    });
  } catch (error) {
    // Handle errors
    console.log(error);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
});

/**
 * GET: Single Org By Id
 */
organizationRouter.get(
  "/v2/organization/get/:organizationId",
  async (req, res) => {
    try {
      const _orgId = req.params.organizationId;

      // Query the database for organization data based on organization ID, pagination, and sorting
      const dbReadyObject = await Organization.findOne({
        organizationId: _orgId,
      });

      // Send response with organization data and pagination information
      return res.status(200).send({
        success: true,
        data: dbReadyObject,
      });
    } catch (error) {
      // Handle errors
      console.log(error);
      return res
        .status(500)
        .json({ success: false, message: "Internal server error" });
    }
  }
);

/**
 * PUT: Update Org Info
 */
organizationRouter.put(
  "/v2/organization/edit/:organizationId",
  async (req, res) => {
    try {
      // Extract organization ID from request parameters
      const _orgId = req.params.organizationId;

      // Extract organization data from request body
      const _orgName = req.body.organizationName;
      const _phoneNumber = req.body.phoneNumber;
      const _emailAddress = req.body.emailAddress;
      const _addLine1 = req.body.addressLine1;
      const _addLine2 = req.body.addressLine2;
      const _state = req.body.state;
      const _city = req.body.city;
      const _zipCode = req.body.zipCode;
      const _notes = req.body.notes;

      // Check if organization exists
      if (
        !(await Organization.findOne({
          organizationId: _orgId,
        }))
      ) {
        return res.status(404).send({ error: "Organization is not available" });
      }

      // Validate email format
      if (!emailRegex.test(_emailAddress)) {
        return res.status(400).json({
          status: "failed",
          error: "Invalid Email Address.",
        });
      }

      if (!phoneRegex.test(_phoneNumber)) {
        return res.status(400).json({
          status: "failed",
          error: "Invalid Phone Number.",
        });
      }

      // Update organization data
      const dbReadyObject = await Organization.updateOne(
        { organizationId: _orgId },
        {
          $set: {
            organizationName: _orgName,
            emailAddress: _emailAddress,
            phoneNumber: _phoneNumber,
            addressLine1: _addLine1,
            addressLine2: _addLine2,
            state: _state,
            city: _city,
            zipCode: _zipCode,
            notes: _notes,
            updatedAt: new Date(),
          },
        }
      );

      // Send success response
      return res.status(200).send({
        message: "Organization Updated Successfully",
        data: dbReadyObject,
      });
    } catch (error) {
      // Handle errors
      console.log(error);
      return res.status(400).send({ error: error.message });
    }
  }
);

/**
 * PUT: Soft Delete Org
 */
organizationRouter.put(
  "/v2/organization/setdelete/:organizationId",
  authorization,
  async (req, res) => {
    try {
      // Check if the user has the required role
      if (req.role !== "superadmin") {
        // If not authorized, send a 403 Forbidden response
        res.status(403).send("Authentication failed.");
        return;
      }

      // Extract organization ID from request body
      const _orgId = req.params.organizationId;

      // Soft delete the organization by updating the 'isDeleted' field
      const dbReadyObject = await Organization.updateOne(
        { organizationId: _orgId },
        { $set: { isDeleted: true } }
      );

      // Send success response
      return res
        .status(200)
        .json({ success: true, message: "Organization Deleted." });
    } catch (error) {
      // Handle errors
      console.log(error);
      return res.status(500).send({ error: error.message });
    }
  }
);

export default organizationRouter;
