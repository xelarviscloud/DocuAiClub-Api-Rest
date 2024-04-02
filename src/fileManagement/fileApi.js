import express from "express";
import { sendErrorResponse } from "../utility/extensions.js";
import upload from "../services/multerFileUpload/multerFileUpload.js";
import dotenv from "dotenv";
import Document from "../database/models/document.js";
dotenv.config();

const fileRouter = express.Router();

/**
 * POST: File
 */
fileRouter.post("/v2/file", upload.single("file"), async (req, res) => {
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

    const documentData = new Document({
      locationId: _locId,

      fileId: _fileId,
      fileName: _fileName,

      userId: _userId,
      userName: _userName,

      metadata: req.file,
      notes: _notes,
    });

    console.log("file data", documentData);
    await documentData.save();
    // Queue Message

    // Send success response
    return res.status(200).send({
      message: "File Uploaded Successfully",
    });
  } catch (error) {
    return sendErrorResponse(res, error);
  }
});

export default fileRouter;
