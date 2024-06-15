import express from "express";
import { sendErrorResponse, truthyCheck } from "../utility/extensions.js";
import dotenv from "dotenv";
import DocumentCollection from "../database/models/document.js";
import PageCollection from "../database/models/page.js";
dotenv.config();

const documentSearchRouter = express.Router();

documentSearchRouter.get(
  "/v2/documents/dashboard/:organizationId/:locationId",
  async (req, res) => {
    try {
      const _locationId = req.params.locationId;
      const _organizationId = req.params.organizationId;

      console.log("Dashboard Document Request", _organizationId, _locationId);

      if (!truthyCheck(_locationId) && !truthyCheck(_organizationId)) {
        return res.status(200).send({
          success: false,
          message: "Missing Param",
        });
      }

      const documents = await DocumentCollection.aggregate([
        {
          $match: {
            locationId: truthyCheck(_locationId) || { $ne: null },
            organizationId: _organizationId,
            isDeleted: { $ne: true },
          },
        },
        {
          $lookup: {
            from: "locations",
            localField: "locationId",
            foreignField: "locationId",
            as: "vw_doc_loc",
          },
        },
        {
          $lookup: {
            from: "users",
            localField: "userName",
            foreignField: "userName",
            as: "vw_doc_user",
          },
        },

        {
          $project: {
            _id: 1,
            fileName: 1,
            userName: 1,
            status: 1,
            createdAt: 1,
            blobPath: 1,
            firstName: "$vw_doc_user.firstName",
            lastName: "$vw_doc_user.lastName",
            locationName: "$vw_doc_loc.locationName",
          },
        },
      ]);

      return res.status(200).send({
        success: true,
        documents,
      });
    } catch (error) {
      sendErrorResponse(error);
    }
  }
);

documentSearchRouter.get("/v2/pages/search", async (req, res) => {
  try {
    let _content = req.query.content;
    let _confirmationNumber = req.query.confirmationNumber;
    let _arrivalDate = req.query.arrivalDate;
    let _departureDate = req.query.departureDate;
    let _createdDate = req.query.createdDate;
    let _name = req.query.name;
    let _locationId = req.query.locationId;
    let _organizationId = req.query.organizationId;

    let query = {};

    if (!truthyCheck(_locationId) && !truthyCheck(_organizationId)) {
      return res.status(200).send({
        success: false,
        message: "Missing Param",
      });
    }

    console.log(_organizationId, _locationId);

    if (truthyCheck(_locationId)) {
      if (!query.$and) {
        query = { $and: [] };
      }
      query.$and.push({
        locationId: _locationId,
      });
    }

    if (truthyCheck(_organizationId)) {
      if (!query.$and) {
        query = { $and: [] };
      }
      query.$and.push({
        organizationId: _organizationId,
      });
    }

    if (truthyCheck(_content)) {
      if (!query.$and) {
        query = { $and: [] };
      }
      query.$and.push({
        dataContentToSearch: {
          $regex: ".*" + _content?.toLocaleLowerCase() + ".*",
        },
      });
    }

    if (truthyCheck(_confirmationNumber)) {
      if (!query.$and) {
        query = { $and: [] };
      }
      query.$and.push({
        "tags.confirmationNumber": {
          $regex: ".*" + _confirmationNumber + ".*",
        },
      });
    }

    if (truthyCheck(_name)) {
      if (!query.$and) {
        query = { $and: [] };
      }
      query.$and.push({
        "tags.name": { $regex: ".*" + _name + ".*" },
      });
    }

    if (truthyCheck(_arrivalDate)) {
      if (!query.$and) {
        query = { $and: [] };
      }
      //query.tags = { $exists: true };
      query.$and.push({
        "tags.arrivalDate": {
          $gte: _arrivalDate,
        },
      });
    }

    if (truthyCheck(_departureDate)) {
      if (!query.$and) {
        query = { $and: [] };
      }
      query.$and.push({
        "tags.departureDate": {
          $lte: _departureDate,
        },
      });
    }
    if (truthyCheck(_createdDate)) {
      if (!query.$and) {
        query = { $and: [] };
      }
      query.$and.push({
        createdAt: {
          $gte: new Date(_createdDate),
        },
      });
    }

    console.log("array", query);

    const _pages = await PageCollection.find(query);
    console.log("pages", _pages.length);
    return res.status(200).send(_pages);
  } catch (error) {
    return sendErrorResponse(res, error);
  }
});

documentSearchRouter.get("/v2/documents/search", async (req, res) => {
  try {
    console.log("Documents Search", req.query);

    let _fileName = req.query.fileName;
    let _status = req.query.status;
    let _pageCount = req.query.pageCount;
    let _createdStartDate = req.query.createdStartDate;
    let _createdEndDate = req.query.createdEndDate;

    let _locationId = req.query.locationId;
    let _organizationId = req.query.organizationId;

    let _p = truthyCheck(_pageCount)
      ? { $gte: parseInt(_pageCount) }
      : { $ne: null };
    console.log("_p", _p);
    const documentsWithPages = await DocumentCollection.aggregate([
      {
        $match: {
          $and: [
            {
              fileName: {
                $regex: ".*" + _fileName?.toLocaleLowerCase() + ".*",
              },
            },
          ],
          locationId: truthyCheck(_locationId) || { $ne: null },
          organizationId: _organizationId,
          status: _status,
          pageCount: _p,
          createdAt: {
            $gte: new Date(_createdStartDate),
          },
          createdAt: {
            $lte: addDays(_createdEndDate, 1),
          },
        },
      },
      {
        $lookup: {
          from: "pages",
          localField: "_id",
          foreignField: "documentId",
          as: "vw_doc_pages",
        },
      },
    ]);

    console.log("documents", documentsWithPages);
    return res.status(200).send({ documentsWithPages });
  } catch (error) {
    return sendErrorResponse(res, error);
  }
});

function addDays(date, days) {
  var result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

export default documentSearchRouter;
