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

const organizationRouter = express.Router();

// API for add organization data
organizationRouter.post("/v2/organization/add", authorization, async (req, res) => {
    try {
        // Check if the user has superadmin role
        if (req.role !== "superadmin") {
            res.status(403).send("You don't have access");
            return;
        }

        // Extract data from the request body
        const name = req.body.name
        const phone_number = req.body.phone_number
        const email = req.body.email
        const address_line1 = req.body.address_line1
        const address_line2 = req.body.address_line2
        const state = req.body.state
        const city = req.body.city
        const zip_code = req.body.zip_code
        const notes = req.body.notes

        // Verify the incoming data
        if (!name || !phone_number || !email || !address_line1 || !state || !city || !zip_code) {
            return res.status(400).json({
                status: "failed",
                error: "Please provide all required fields"
            });
        }

        // Validate email format
        if (!emailRegex.test(email)) {
            return res.status(400).json({
                status: "failed",
                error: "Please provide a valid email address"
            });
        }

        // Validate phone number format (+1 followed by 10 digits)
        if (!phoneRegex.test(phone_number)) {
            return res.status(400).json({
                status: "failed",
                error: "Please provide a phone number in US format (+1 followed by 10 digits)"
            });
        }

        // Check if email or phone number already exists in any collection
        const existingOrganization = await Organization.aggregate([
            {
                $match: {
                    $or: [
                        { email },
                        { phone_number }
                    ]
                }
            }
        ]);

        if (existingOrganization.length > 0) {
            return res.status(400).json({
                status: "failed",
                error: "Email or phone number already exists"
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
            notes
        });

        await organizationData.save(); // Saving organization data

        // Return success response
        res.status(201).json({
            status: "success",
            message: "Organization added successfully",
            organization: organizationData
        });

    } catch (error) {
        // Handle any errors
        console.error("Error:", error);
        res.status(500).json({ status: "failed", error: "Internal server error" });
    }
});

// API for get all organization data
organizationRouter.get("/v2/organization/get/all", async (req, res) => {
    try {

        // Calculate page and pageSize using the function
        const { page, pageSize, skip } = calculatePagination(req);
        const search = req.query.search || '';

        // Construct search filter based on the search query parameter
        const searchFilter = search ? {
            $or: [
                { name: { $regex: new RegExp(search, 'i') } },
                { phone_number: { $regex: new RegExp(search, 'i') } },
                { email: { $regex: new RegExp(search, 'i') } },
                { address_line1: { $regex: new RegExp(search, 'i') } },
                { address_line2: { $regex: new RegExp(search, 'i') } },
                { state: { $regex: new RegExp(search, 'i') } },
                { city: { $regex: new RegExp(search, 'i') } },
                { zip_code: { $regex: new RegExp(search, 'i') } },
                { notes: { $regex: new RegExp(search, 'i') } }
            ]
        } : {};

        // Query the database for organizations data based on search filter, pagination, and sorting
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
            totalPages: Math.ceil(totalDocuments / pageSize)
        });

    } catch (error) {
        // Handle errors
        console.log(error);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
});

// API for get a single organizationdata
organizationRouter.get("/v2/organization/get/:organizationid", async (req, res) => {
    try {
        const organizationid = req.params.organizationid;

        // Query the database for organization data based on organization ID, pagination, and sorting
        const organizationData = await Organization.findOne({ organizationid })

        // Send response with organization data and pagination information
        return res.status(200).send({
            success: true,
            data: organizationData,
        });

    } catch (error) {
        // Handle errors
        console.log(error);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
});

// API for editing organization data
organizationRouter.put("/v2/organization/edit/:organizationid", async (req, res) => {
    try {
        // Extract organization ID from request parameters
        const organizationid = req.params.organizationid

        // Extract organization data from request body
        const name = req.body.name
        const phone_number = req.body.phone_number
        const address_line1 = req.body.address_line1
        const address_line2 = req.body.address_line2
        const state = req.body.state
        const city = req.body.city
        const zip_code = req.body.zip_code
        const notes = req.body.notes

        // Find the organization data by its ID
        const organizationData = await Organization.findOne({ organizationid: organizationid });

        // Check if organization exists
        if (!organizationData) {
            return res.status(404).send({ error: "Organization is not available" });
        }

        // Validate phone number format
        if (phone_number && !phoneRegex.test(phone_number)) {
            return res.status(401).send({
                status: "failed",
                error: "Phone number must be in US format (+1 followed by 10 digits)",
            });
        }

        // Check if the provided phone number is unique (if modified)
        if (phone_number && phone_number !== organizationData.phone_number) {
            const phoneExist = await Organization.findOne({ phone_number: phone_number });
            if (phoneExist) {
                return res.status(400).send({ error: 'Phone number is already added' });
            }
        }

        // Update organization data
        const organizationUpdation = await Organization.updateOne({ organizationid: organizationid }, {
            $set: {
                name,
                phone_number,
                address_line1,
                address_line2,
                state,
                city,
                zip_code,
                notes,
                updatedAt: new Date()
            }
        });

        // Send success response
        return res.status(200).send({ message: 'Organization Edit Successfully', data: organizationUpdation });

    } catch (error) {
        // Handle errors
        console.log(error);
        return res.status(400).send({ error: error.message });
    }
})

// API for soft deleting an organization
organizationRouter.put("/v2/organization/softdelete/:organizationid", authorization, async (req, res) => {
    try {
        // Check if the user has the required role
        if (req.role !== 'superadmin') {
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
        return res.status(200).json({ success: true, message: "Organization Delete Successfully" });
    } catch (error) {
        // Handle errors
        console.log(error);
        return res.status(500).send({ error: error.message });
    }
})

export default organizationRouter;