import express from "express";
import { sendErrorResponse, truthyCheck } from "../utility/extensions.js";
import upload from "../services/multerFileUpload/multerFileUpload.js";
import dotenv from "dotenv";
import DocumentCollection from "../database/models/document.js";
import { BlobServiceClient } from "@azure/storage-blob";
import fs from "fs";
import azure from "azure-storage";
import PageCollection from "../database/models/page.js";
dotenv.config();

const documentRouter = express.Router();

/**
 * POST: File
 */
documentRouter.post(
  "/v2/file/upload",
  upload.single("file"),
  async (req, res) => {
    try {
      console.log("file upload", req.file, req.body);

      // Steps
      // File Upload
      // Persist in db

      // Save data in the database Location collection
      const _locId = req.body.locationId;
      const _orgId = req.body.organizationId;
      const _userId = req.body.userId;
      const _userName = req.body.userName;
      const _fileName = req.body.fileName?.toLowerCase();
      const _fileId = req.file.blob;
      const _notes = req.body.notes;
      const _blobPath = req.file.blob;

      const documentData = new DocumentCollection({
        locationId: _locId,
        organizationId: _orgId,

        fileId: _fileId,
        fileName: _fileName?.toLowerCase(),

        userId: _userId,
        userName: _userName,

        metadata: req.file,
        notes: _notes,

        status: "New",
        pageCount: 0,
        blobPath: _blobPath,
      });

      let result = await documentData.save();
      console.log("Saved Document Result", result);
      // Queue Message
      queueMessage({
        metadata: req.file,
        locationId: _locId,
        userId: _userId,
        userName: _userName,
        documentId: result._id,
      });
      // Send success response
      return res.status(200).send({
        message: "File Uploaded Successfully",
      });
    } catch (error) {
      return sendErrorResponse(res, error);
    }
  }
);

function queueMessage(message) {
  const connStr = process.env.AZURE_STORAGE_CONNECTION;
  var queueSvc = azure.createQueueService(connStr);
  queueSvc.createMessage(
    "document-upload-dev-que",
    Buffer.from(JSON.stringify(message)).toString("base64"),
    function (error, result, response) {
      if (!error) {
        // Message inserted
      }
    }
  );
}

documentRouter.get("/v2/file/download", async (req, res) => {
  try {
    console.log("file upload", req.query);

    const _blobName = req.query.fileName;
    const connStr = process.env.AZURE_STORAGE_CONNECTION;
    const containerName = process.env.AZURE_STORAGE_CONTAINER;

    const blobServiceClient = BlobServiceClient.fromConnectionString(connStr);
    const containerClient = blobServiceClient.getContainerClient(containerName);
    const blockBlobClient = containerClient.getBlockBlobClient(_blobName);

    const downloadBlockBlobResponse = await blockBlobClient.download(0);
    const writableStream = await streamToText(
      downloadBlockBlobResponse.readableStreamBody
    );

    var data = fs.readFileSync("src/1.pdf");
    //res.contentType("application/pdf");
    //return res.send(data);

    // const containerClient = blobServiceClient.getContainerClient(containerName);
    var blobSvc = azure.createBlobService(connStr);

    // blobSvc.createContainerIfNotExists(
    //   "mycontainer",
    //   function (error, result, response) {
    //     if (!error) {
    //       // Container exists and allows
    //       // anonymous read access to blob
    //       // content and metadata within this container
    //     }
    //   }
    // );

    var writable = fs.createWriteStream("pdf-file.png");

    blobSvc.getBlobToStream(
      "mycontainer",
      "pdf-file.png",
      writable,
      function (error, result, response) {
        if (!error) {
          // blob retrieved
        }
      }
    );

    //pdf-file.png

    return res.status(200).send(writable);
  } catch (error) {
    return sendErrorResponse(res, error);
  }
});

/**
 * GET: Get File Details by Location Id
 */
documentRouter.get("/v2/documents/location/:locationId", async (req, res) => {
  try {
    const _locationId = req.params.locationId;

    const documents = await DocumentCollection.aggregate([
      {
        $match: {
          locationId: _locationId,
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
});

// Convert stream to text
async function streamToText(readable) {
  console.log(readable);
  readable.setEncoding("binary");
  let data = "";
  for await (const chunk of readable) {
    data += chunk;
  }
  return data;
}

/**
 * GET: Get File Details by Location Id
 */
documentRouter.get("/v2/pages/location/:locationId", async (req, res) => {
  try {
    const _locationId = req.params.locationId;

    const pages = await PageCollection.aggregate([
      {
        $match: {
          locationId: _locationId,
          isDeleted: { $ne: true },
        },
      },
    ]);

    return res.status(200).send({
      success: true,
      pages,
    });
  } catch (error) {
    sendErrorResponse(error);
  }
});

documentRouter.get("/v2/pages/search", async (req, res) => {
  try {
    console.log("Page Search", req.query);

    let _content = req.query.content;
    let _confirmationNumber = req.query.confirmationNumber;
    let _arrivalDate = req.query.arrivalDate;
    let _departureDate = req.query.departureDate;
    let _createdDate = req.query.createdDate;
    let _name = req.query.name;
    let _locationId = req.query.locationId;
    let query = {
      // $or: [],
      // $and: [],
    };

    if (truthyCheck(_locationId)) {
      if (!query.$and) {
        query = { $and: [] };
      }
      query.$and.push({
        locationId: _locationId,
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
          $gte: _createdDate,
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

documentRouter.get("/v2/documents/search", async (req, res) => {
  try {
    console.log("Documents Search", req.query);

    let _fileName = req.query.fileName;
    let _status = req.query.status;
    let _pageCount = req.query.pageCount;
    let _departureDate = req.query.departureDate;
    let _createdDate = req.query.createdDate;
    let _locationId = req.query.locationId;
    let _organizationId = req.query.organizationId;

    if ((!_locationId && !_organizationId) || !_createdDate) {
      res.status(401).send({
        status: "failed",
        error: "Required field(s) missing.",
      });
      return;
    }

    let query = {
      // $or: [],
      // $and: [],
    };

    if (truthyCheck(_organizationId)) {
      if (!query.$and) {
        query = { $and: [] };
      }
      query.$and.push({
        organizationId: _organizationId,
      });
    }
    if (truthyCheck(_locationId)) {
      if (!query.$and) {
        query = { $and: [] };
      }
      query.$and.push({
        locationId: _locationId,
      });
    }

    if (truthyCheck(_fileName)) {
      if (!query.$and) {
        query = { $and: [] };
      }
      query.$and.push({
        fileName: {
          $regex: ".*" + _fileName?.toLocaleLowerCase() + ".*",
        },
      });
    }

    if (truthyCheck(_status)) {
      if (!query.$and) {
        query = { $and: [] };
      }
      query.$and.push({
        status: {
          $regex: ".*" + _status + ".*",
        },
      });
    }
    // if (truthyCheck(_arrivalDate)) {
    //   if (!query.$and) {
    //     query = { $and: [] };
    //   }
    //   //query.tags = { $exists: true };
    //   query.$and.push({
    //     "tags.arrivalDate": {
    //       $gte: _arrivalDate,
    //     },
    //   });
    // }

    // if (truthyCheck(_departureDate)) {
    //   if (!query.$and) {
    //     query = { $and: [] };
    //   }
    //   query.$and.push({
    //     "tags.departureDate": {
    //       $lte: _departureDate,
    //     },
    //   });
    // }

    // if (truthyCheck(_createdDate)) {
    //   if (!query.$and) {
    //     query = { $and: [] };
    //   }
    //   query.$and.push({
    //     createdAt: {
    //       $gte: _createdDate,
    //     },
    //   });
    // }
    let _p = truthyCheck(_pageCount) ? parseInt(_pageCount) : { $ne: null };
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
          locationId: _locationId,
          status: _status,
          pageCount: _p,
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
    const _documents = await DocumentCollection.find(query);
    console.log("Documents", documentsWithPages);
    return res.status(200).send({ documentsWithPages });
  } catch (error) {
    return sendErrorResponse(res, error);
  }
});

export default documentRouter;
