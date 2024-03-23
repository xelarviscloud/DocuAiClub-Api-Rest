/**
 * CRUD LOCATION OPERATION
 *
 * GET:ALL
 * GET:detail:id
 * POST: body
 * PUT: body << soft delete is via PUT
 * DELETE: Id << dont implement right now
 */
import express from "express";
import Location from "../models/location.js"; //Importing the location model
import uuid4 from "uuid4";
import authorization from "../services/authorizationMiddleware/authorization.js";
import { emailRegex, phoneRegex } from "../utility/regex.js";
import { calculatePagination } from "../services/pagination/paginationFunction.js";
import { SearchFilter } from "../services/searching/searchingFilters.js";
import Organization from "../models/organization.js";

const locationRouter = express.Router();

/**
 * Location Health Check
 */
locationRouter.get("/v2/location", async (req, res) => {
  return res.status(200).send({
    Message: "Location Controller - running okay!",
  });
});

/**
 * POST: Add New Location
 */
locationRouter.post("/v2/location/add", authorization, async (req, res) => {
  try {
    // Check if the user has superadmin role
    if (req.role !== "superadmin" || !req.role == "organizationadmin") {
      res.status(403).send("You don't have access");
      return;
    }

    // Extract data from the request body
    const organizationid = req.body.organizationid;
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
      !organizationid ||
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

    // Save data in the database Location collection
    const locationData = new Location({
      locationid: uuid4(), // Generating a unique location ID
      organizationid,
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

    await locationData.save(); // Saving location data

    // Return success response
    res.status(201).json({
      status: "success",
      message: "Location added successfully",
      location: locationData,
    });
  } catch (error) {
    // Handle any errors
    console.error("Error:", error);
    res.status(500).json({ status: "failed", error: "Internal server error" });
  }
});

/**
 * GET All Location
 */
locationRouter.get("/v2/location/get", async (req, res) => {
  try {
    // Calculate page and pageSize using the function
    const { page, pageSize, skip } = calculatePagination(req);
    const search = req.query.search || "";
    const searchFilter = SearchFilter(search);

    /**
     * GET Location by Search Criteria
     */
    const locationData = await Location.find({
      ...searchFilter,
      isDeleted: { $ne: true },
    })
      .sort({ _id: -1 })
      .skip(skip)
      .limit(pageSize);

    // Count total documents matching the search filter for pagination
    const totalDocuments = await Location.countDocuments(searchFilter);

    // Function to retrieve organization data based on organization ID
    const organizationDetails = async (organizationid) => {
      return await Organization.findOne({ organizationid }).sort({ _id: -1 });
    };

    const promises = locationData.map(async (locationDetail) => {
      const organizationData = await organizationDetails(
        locationDetail.organizationid
      );
      const parentOrganization = organizationData
        ? organizationData.name
        : null;
      return {
        data: locationDetail,
        parentOrganization,
      };
    });

    const locations = await Promise.all(promises);

    // Send response with locations data and pagination information
    return res.status(200).send({
      success: true,
      data: locations,
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
 * GET: Single Location By Id
 */
locationRouter.get("/v2/location/get/:locationid", async (req, res) => {
  try {
    const locationid = req.params.locationid;

    // Query the database for location data based on location ID, pagination, and sorting
    const locationData = await Location.find({
      locationid,
      isDeleted: { $ne: true },
    });

    // Function to retrieve organization data based on organization ID
    const organizationDetails = async (organizationid) => {
      return await Organization.findOne({ organizationid }).sort({ _id: -1 });
    };

    const promises = locationData.map(async (locationDetail) => {
      const organizationData = await organizationDetails(
        locationDetail.organizationid
      );
      const parentOrganization = organizationData
        ? organizationData.name
        : null;
      return {
        data: locationDetail,
        parentOrganization,
      };
    });

    const locations = await Promise.all(promises);

    // Send response with location data and pagination information
    return res.status(200).send({
      success: true,
      data: locations,
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
 * GET: Organization Wise Location
 */
locationRouter.get(
  "/v2/organization/location/get/:organizationid",
  async (req, res) => {
    try {
      // Calculate page and pageSize using the function
      const { page, pageSize, skip } = calculatePagination(req);
      const search = req.query.search || "";
      const searchFilter = SearchFilter(search);

      const organizationid = req.params.organizationid;

      // Query the database for location data based on organization ID, pagination, and sorting
      const locationData = await Location.find({
        organizationid,
        ...searchFilter,
        isDeleted: { $ne: true },
      })
        .sort({ _id: -1 })
        .skip(skip)
        .limit(pageSize);

      // Function to retrieve organization data based on organization ID
      const organizationDetails = async (organizationid) => {
        return await Organization.findOne({ organizationid }).sort({ _id: -1 });
      };

      const promises = locationData.map(async (locationDetail) => {
        const organizationData = await organizationDetails(
          locationDetail.organizationid
        );
        const parentOrganization = organizationData
          ? organizationData.name
          : null;
        return {
          data: locationDetail,
          parentOrganization,
        };
      });

      const locations = await Promise.all(promises);

      // Retrieve total document count for pagination
      const totalDocuments = await Location.countDocuments({
        organizationid,
        ...searchFilter,
        isDeleted: { $ne: true }, // Exclude documents where isDeleted is true
      });

      // Send response with location data and pagination information
      return res.status(200).send({
        success: true,
        data: locations,
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
  }
);

/**
 * PUT: Update Lcoation Info
 */
locationRouter.put("/v2/lcoation/edit/:locationid", async (req, res) => {
  try {
    // Extract lcoation ID from request parameters
    const locationid = req.params.locationid;

    // Extract lcoation data from request body
    const name = req.body.name;
    const email = req.body.email;
    const phone_number = req.body.phone_number;
    const address_line1 = req.body.address_line1;
    const address_line2 = req.body.address_line2;
    const state = req.body.state;
    const city = req.body.city;
    const zip_code = req.body.zip_code;
    const notes = req.body.notes;

    // Find the location data by its ID
    const lcoationData = await Location.findOne({
      locationid: locationid,
    });

    // Check if location exists
    if (!lcoationData) {
      return res.status(404).send({ error: "Location is not available" });
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

    // Update location data
    const locationUpdation = await Location.updateOne(
      { locationid: locationid },
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
      message: "Location Edit Successfully",
      data: locationUpdation,
    });
  } catch (error) {
    // Handle errors
    console.log(error);
    return res.status(400).send({ error: error.message });
  }
});

/**
 * PUT: Soft Delete Location
 */
locationRouter.put(
  "/v2/location/softdelete/:locationid",
  authorization,
  async (req, res) => {
    try {
      // Check if the user has the required role
      if (req.role !== "superadmin") {
        // If not authorized, send a 403 Forbidden response
        res.status(403).send("You don't have access");
        return;
      }

      // Extract location ID from request body
      const locationid = req.params.locationid;

      // Soft delete the location by updating the 'isDeleted' field
      const softDeleteLocation = await Location.updateOne(
        { locationid: locationid },
        { $set: { isDeleted: true } }
      );

      // Send success response
      return res
        .status(200)
        .json({ success: true, message: "Location Delete Successfully" });
    } catch (error) {
      // Handle errors
      console.log(error);
      return res.status(500).send({ error: error.message });
    }
  }
);

export default locationRouter;
