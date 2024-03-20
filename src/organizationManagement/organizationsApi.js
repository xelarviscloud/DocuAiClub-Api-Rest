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
import { emailRegex, phoneRegex } from "../regex/regex.js";
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
 * POST: Add New Org
 */
organizationRouter.post(
  "/v2/organization/add",
  authorization,
  async (req, res) => {
    try {
      // Check if the user has superadmin role
      if (req.role !== "superadmin") {
        res.status(403).send("You don't have access");
        return;
      }

      // Extract data from the request body
      const name = req.body.name;
      const phone_number = req.body.phone_number;
      const email = req.body.email;
      const address_line1 = req.body.address_line1;
      const address_line2 = req.body.address_line2;
      const state = req.body.state;
      const city = req.body.city;
      const zip_code = req.body.zip_code;
      const notes = req.body.notes;

      // Verify the incoming data
      if (
        !name ||
        !phone_number ||
        !email ||
        !address_line1 ||
        !state ||
        !city ||
        !zip_code
      ) {
        return res.status(400).json({
          status: "failed",
          error: "Please provide all required fields",
        });
      }

      // Validate email format
      if (!emailRegex.test(email)) {
        return res.status(400).json({
          status: "failed",
          error: "Please provide a valid email address",
        });
      }

      // Validate phone number format (+1 followed by 10 digits)
      if (!phoneRegex.test(phone_number)) {
        return res.status(400).json({
          status: "failed",
          error:
            "Please provide a phone number in US format (+1 followed by 10 digits)",
        });
      }

      // Save data in the database Organization collection
      const organizationData = new Organization({
        organizationid: uuid4(), // Generating a unique organization ID
        name,
        phone_number,
        email,
        address_line1,
        address_line2,
        state,
        city,
        zip_code,
        notes,
      });

      await organizationData.save(); // Saving organization data

      // Return success response
      res.status(201).json({
        status: "success",
        message: "Organization added successfully",
        organization: organizationData,
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
  "/v2/organization/get/:organizationid",
  async (req, res) => {
    try {
      const organizationid = req.params.organizationid;

      // Query the database for organization data based on organization ID, pagination, and sorting
      const organizationData = await Organization.findOne({ organizationid });

      // Send response with organization data and pagination information
      return res.status(200).send({
        success: true,
        data: organizationData,
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
  "/v2/organization/edit/:organizationid",
  async (req, res) => {
    try {
      // Extract organization ID from request parameters
      const organizationid = req.params.organizationid;

      // Extract organization data from request body
      const name = req.body.name;
      const phone_number = req.body.phone_number;
      const email = req.body.email
      const address_line1 = req.body.address_line1;
      const address_line2 = req.body.address_line2;
      const state = req.body.state;
      const city = req.body.city;
      const zip_code = req.body.zip_code;
      const notes = req.body.notes;

      // Find the organization data by its ID
      const organizationData = await Organization.findOne({
        organizationid: organizationid,
      });

      // Check if organization exists
      if (!organizationData) {
        return res.status(404).send({ error: "Organization is not available" });
      }

      // Validate email format
      if (email && !emailRegex.test(email)) {
        return res.status(400).json({
          status: "failed",
          error: "Please provide a valid email address",
        });
      }

      // Validate phone number format
      if (phone_number && !phoneRegex.test(phone_number)) {
        return res.status(401).send({
          status: "failed",
          error: "Phone number must be in US format (+1 followed by 10 digits)",
        });
      }

      // Update organization data
      const organizationUpdation = await Organization.updateOne(
        { organizationid: organizationid },
        {
          $set: {
            name,
            email,
            phone_number,
            address_line1,
            address_line2,
            state,
            city,
            zip_code,
            notes,
            updatedAt: new Date(),
          },
        }
      );

      // Send success response
      return res.status(200).send({
        message: "Organization Edit Successfully",
        data: organizationUpdation,
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
  "/v2/organization/softdelete/:organizationid",
  authorization,
  async (req, res) => {
    try {
      // Check if the user has the required role
      if (req.role !== "superadmin") {
        // If not authorized, send a 403 Forbidden response
        res.status(403).send("You don't have access");
        return;
      }

      // Extract organization ID from request body
      const organizationid = req.params.organizationid;

      // Soft delete the organization by updating the 'isDeleted' field
      const softDeleteOrganization = await Organization.updateOne(
        { organizationid: organizationid },
        { $set: { isDeleted: true } }
      );

      // Send success response
      return res
        .status(200)
        .json({ success: true, message: "Organization Delete Successfully" });
    } catch (error) {
      // Handle errors
      console.log(error);
      return res.status(500).send({ error: error.message });
    }
  }
);

export default organizationRouter;