import express from "express";
import { sendErrorResponse, truthyCheck } from "../utility/extensions.js";
import upload from "../services/multerFileUpload/multerFileUpload.js";
import dotenv from "dotenv";
import DocumentCollection from "../database/models/document.js";
import { BlobServiceClient } from "@azure/storage-blob";
import fs from "fs";
import azure from "azure-storage";
import getAzureBlobAsBuffer from "../services/azureServices/blobService.js";
import { sendEmail } from "../services/communication/sendEmail.js";
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
      const _fileName = req.body.fileName.toLowerCase();
      const _fileId = req.file.blob;
      const _notes = req.body.notes;
      const _blobPath = req.file.blob;

      let fileMetadata = req.file;

      const documentData = new DocumentCollection({
        locationId: _locId,
        organizationId: _orgId,

        fileId: _fileId,
        fileName: _fileName?.toLowerCase(),

        userId: _userId,
        userName: _userName,

        metadata: fileMetadata,
        notes: _notes,

        status: "New",
        pageCount: 0,
        blobPath: _blobPath,

        createdAt: new Date(),
      });

      let result = await documentData.save();

      // Queue Message
      queueMessage({
        metadata: req.file,
        locationId: _locId,
        organizationId: _orgId,
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
  const queuName = process.env.AZURE_STORAGE_QUEUE;
  var queueSvc = azure.createQueueService(connStr);
  queueSvc.createMessage(
    queuName,
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
    console.log(error);
    return sendErrorResponse(res, error);
  }
});

/**
 * GET: Get File Details by Location Id
 */
documentRouter.get("/v2/documents/location/:locationId", async (req, res) => {
  try {
    const _locationId = req.params.locationId;

    if (!truthyCheck(_locationId)) {
      return res.status(200).send({
        success: false,
        message: "Missing Param",
      });
    }

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

documentRouter.post("/v2/document/shareDocument", async (req, res) => {
  try {
    console.log("email--", req.body);

    const _emailAddress = req.body.emailAddress;
    const _blobPath = req.body.blobPath;
    const _emailSubject = req.body.emailSubject;
    const _emailBody = req.body.emailBody;

    const buffer = await getAzureBlobAsBuffer(_blobPath);

    sendEmail(
      _emailAddress,
      _emailSubject,
      _emailBody,
      _blobPath?.split("/")[1],
      buffer
    )
      .then((result) => {
        return res.status(200).send({
          message: "Email Sent Successfully",
        });
      })
      .catch((err) => {
        return sendErrorResponse(res, err);
      });
  } catch (error) {
    return sendErrorResponse(res, error);
  }
});

documentRouter.post("/v2/pages/sharePage", async (req, res) => {
  try {
    await blobPathToBuffer(req, res);
  } catch (error) {
    return sendErrorResponse(res, error);
  }
});

documentRouter.post(
  "/v2/document/sendTestEmail",
  upload.single("file"),
  async (req, res) => {
    try {
      console.log("email", req.file, req.body);
      testEmail();
      // Send success response
      return res.status(200).send({
        message: "Email Sent Successfully",
      });
    } catch (error) {
      return sendErrorResponse(res, error);
    }
  }
);

export default documentRouter;
