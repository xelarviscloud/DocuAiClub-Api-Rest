import express from "express";
import { sendErrorResponse } from "../utility/extensions.js";
import dotenv from "dotenv";
import azure from "azure-storage";
import { Readable } from "stream";

dotenv.config();

const azureBlobRouter = express.Router();

azureBlobRouter.get("/v2/blob/downloadImage", async (req, res) => {
  try {
    const _blobName = req.query.fileName;
    const connStr = process.env.AZURE_STORAGE_CONNECTION;
    const containerName = process.env.AZURE_STORAGE_CONTAINER;

    var blobSvc = azure.createBlobService(connStr);

    blobSvc.getBlobToStream(
      "mycontainer",
      "pdf-file.png",
      res,
      function (error) {
        if (!error) {
          // blob retrieved
          //res.writeHead(200, { "Content-Type": "image/png" });
          res.end();
        } else {
          res.end();
        }
      }
    );
  } catch (error) {
    return sendErrorResponse(res, error);
  }
});

azureBlobRouter.get("/v2/blob/downloadPdf", async (req, res) => {
  try {
    const _blobName = req.query.blobPath;
    const connStr = process.env.AZURE_STORAGE_CONNECTION;
    const containerName = process.env.AZURE_STORAGE_CONTAINER;
    console.log("blobPath", _blobName);
    var blobSvc = azure.createBlobService(connStr);

    blobSvc.getBlobToStream(containerName, _blobName, res, function (error) {
      if (!error) {
        res.end();
      } else {
        res.end();
      }
    });
  } catch (error) {
    return sendErrorResponse(res, error);
  }
});

azureBlobRouter.get("/v2/blob/downloadPdfToPages", async (req, res) => {
  try {
    const _blobName = "03fd9cfc20b0-4bc2-a3a9-bc5abedfcca4/1 (2).pdf";
    const connStr = process.env.AZURE_STORAGE_CONNECTION;
    const containerName = process.env.AZURE_STORAGE_CONTAINER;
    console.log("blobPath", _blobName);
    var blobSvc = azure.createBlobService(connStr);
    const blob = new Blob(["hello world"]);
    const stream = blob.stream();
    const newStream = new Readable({
      read() {
        this.push(someBuffer);
      },
    });
    blobSvc.getBlobToStream(
      containerName,
      _blobName,
      newStream,
      function (error) {
        if (!error) {
          console.log("stream", newStream);
        }
        // if (!error) {
        //   res.end();
        // } else {
        //   res.end();
        // }
      }
    );

    return res.status(200).send("good");
  } catch (error) {
    return sendErrorResponse(res, error);
  }
});

export default azureBlobRouter;
