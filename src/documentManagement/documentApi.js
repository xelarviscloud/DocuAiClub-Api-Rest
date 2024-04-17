import express from "express";
import { sendErrorResponse } from "../utility/extensions.js";
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
      const _userId = req.body.userId;
      const _userName = req.body.userName;
      const _fileName = req.body.fileName;
      const _fileId = req.file.blob;
      const _notes = req.body.notes;
      const _blobPath = req.file.blob;

      const documentData = new DocumentCollection({
        locationId: _locId,

        fileId: _fileId,
        fileName: _fileName,

        userId: _userId,
        userName: _userName,

        metadata: req.file,
        notes: _notes,

        status: "New",
        blobPath: _blobPath,
      });

      await documentData.save();
      // Queue Message
      queueMessage({
        metadata: req.file,
        locationId: _locId,
        userId: _userId,
        userName: _userName,
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

    const _confirmationNumber = req.query.confirmationNumber;
    const _arrival = req.query.arrival;
    const _departure = req.query.departure;
    const _name = req.query.name;

    console.log("search", _name, req.query);
    const _pages = await PageCollection.find({
      $or: [
        {
          "tags.name": { $regex: ".*" + _name + ".*" },
        },
        {
          "tags.confirmationNumber": {
            $regex: ".*" + _confirmationNumber + ".*",
          },
        },
        {
          "tags.arrival": {
            $gte: _arrival,
          },
        },
        {
          "tags.departure": {
            $lte: _departure,
          },
        },
      ],
    });

    return res.status(200).send(_pages);
  } catch (error) {
    return sendErrorResponse(res, error);
  }
});

export default documentRouter;
