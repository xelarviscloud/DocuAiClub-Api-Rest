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
    const _blobName = "03fd9cfc20b0-4bc2-a3a9-bc5abedfcca4/yteste.pdf";
    const connStr = process.env.AZURE_STORAGE_CONNECTION;
    const containerName = process.env.AZURE_STORAGE_CONTAINER;
    console.log("blobPath", _blobName);
    const blobServiceClient = await BlobServiceClient.fromConnectionString(
      connStr
    );
    // Get a reference to a container
    const containerClient = await blobServiceClient.getContainerClient(
      containerName
    );
    // Get a block blob client
    const blockBlobClient = containerClient.getBlockBlobClient(_blobName);
    const data = await blockBlobClient.downloadToBuffer(0);
    const pdfDoc = await PDFDocument.load(data);
    const numberOfPages = pdfDoc.getPages().length;
    console.log("data", numberOfPages);

    for (let i = 0; i < numberOfPages; i++) {
      // Create a new "sub" document
      const subDocument = await PDFDocument.create();
      // copy the page at current index
      const [copiedPage] = await subDocument.copyPages(pdfDoc, [i]);
      subDocument.addPage(copiedPage);
      const pdfBytes = await subDocument.save();
      console.log("data", pdfBytes);
      const blockBlobClient = containerClient.getBlockBlobClient(
        `03fd9cfc20b0-4bc2-a3a9-bc5abedfcca4/Page_${i}.pdf`
      );
      const uploadBlobResponse = await blockBlobClient.upload(
        pdfBytes,
        pdfBytes.length
      );

      //let test = await blockBlobClient.uploadData(pdfBytes);
    }
    return res.status(200).send(data);
  } catch (error) {
    return sendErrorResponse(res, error);
  }
});

export default azureBlobRouter;
