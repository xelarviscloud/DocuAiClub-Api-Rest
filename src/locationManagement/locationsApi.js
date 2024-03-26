import express from "express";
import Location from "../models/location.js"; //Importing the location model
import uuid4 from "uuid4";
import authorization from "../services/authorizationMiddleware/authorization.js";
import { emailRegex, phoneRegex } from "../utility/regex.js";
import { calculatePagination } from "../services/pagination/paginationFunction.js";
import { SearchFilter } from "../services/searching/searchingFilters.js";
import OrganizationCollection from "../models/organization.js";
import { shortCircuitEvaluation } from "../utility/extensions.js";

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
 * GET All Locations
 */
locationRouter.get("/v2/locations/get", async (req, res) => {
  try {
    const _orgId = req.query?.organizationId || false;
    const { page, pageSize, skip } = calculatePagination(req);
    const search = req.query.search || "";
    const searchFilter = SearchFilter(search);

    const orgIdQuery = shortCircuitEvaluation(_orgId);

    // const locations = await Location.find({
    //   ...searchFilter,
    //   isDeleted: { $ne: true },
    // })
    //   .sort({ _id: -1 })
    //   .skip(skip)
    //   .limit(pageSize);

    const locations = await Location.aggregate([
      {
        $match: {
          locationOrgId: orgIdQuery || { $ne: null },
        },
      },
      {
        $lookup: {
          from: "organizations",
          localField: "locationOrgId",
          foreignField: "organizationId",
          as: "vw_loc_orgs",
        },
      },
    ]);

    //console.log("loc", _orgId);
    return res.status(200).send({
      success: true,
      data: locations,
      currentPage: page,
      pageSize,
      totalPages: Math.ceil((locations?.length ?? 0) / pageSize),
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
locationRouter.get("/v2/location/get/:locationId", async (req, res) => {
  try {
    const _locId = req.params.locationId;

    // const locationData = await Location.aggregate({
    //   locationId: _locId,
    // });

    const locationData = await Location.aggregate([
      {
        $match: {
          locationId: _locId,
        },
      },
      {
        $lookup: {
          from: "organizations",
          localField: "locationOrgId",
          foreignField: "organizationId",
          as: "vw_loc_orgs",
        },
      },
    ]);

    console.log("loc detail", _locId, locationData);
    return res.status(200).send({
      success: true,
      data: locationData[0],
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
        return await OrganizationCollection.findOne({ organizationid }).sort({
          _id: -1,
        });
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
 * POST: Add New Location
 */
locationRouter.post("/v2/location/add", authorization, async (req, res) => {
  try {
    // Check if the user has superadmin role
    if (req.role !== "superadmin" || !req.role == "organizationadmin") {
      res.status(403).send("Invalid Authorization.");
      return;
    }

    // Extract organization data from request body
    const _orgId = req.body.organizationId;
    const _locName = req.body.locationName;
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
      !_orgId ||
      !_locName ||
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

    // Validations
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

    // Save data in the database Location collection
    const locationData = new Location({
      locationId: uuid4(),
      locationOrgId: _orgId,
      locationName: _locName,
      phoneNumber: _phoneNumber,
      emailAddress: _emailAddress,
      addressLine1: _addLine1,
      addressLine2: _addLine2,
      state: _state,
      city: _city,
      zipCode: _zipCode,
      notes: _notes,
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
 * PUT: Update Location Info
 */
locationRouter.put("/v2/location/edit/:locationId", async (req, res) => {
  try {
    const _locId = req.params.locationId;
    const _locName = req.body.locationName;

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
      !_locId ||
      !_locName ||
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

    // Check if location exists
    if (
      !(await Location.findOne({
        locationId: _locId,
      }))
    ) {
      return res.status(404).send({ error: "Location is not available" });
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

    // Update location data
    const dbReadyObject = await Location.updateOne(
      { locationId: _locId },
      {
        $set: {
          locationName: _locName,
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
      message: "Location Updated Successfully",
      data: dbReadyObject,
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
  "/v2/location/setdelete/:locationId",
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
