import express from "express";
import { sendErrorResponse } from "../utility/extensions.js";
import dotenv from "dotenv";
import { BlobServiceClient } from "@azure/storage-blob";
import fs from "fs";
import azure from "azure-storage";
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
        // blob retrieved
        //res.writeHead(200, { "Content-Type": "image/png" });
        //console.log(res);
        res.end();
      } else {
        res.end();
      }
    });
  } catch (error) {
    return sendErrorResponse(res, error);
  }
});

export default azureBlobRouter;
