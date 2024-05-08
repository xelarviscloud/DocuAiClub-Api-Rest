import mongoose from "mongoose";

const documentSchema = new mongoose.Schema({
  locationId: {
    type: String,
  },
  organizationId: {
    type: String,
  },
  fileId: {
    type: String,
  },
  fileName: {
    type: String,
  },
  userId: {
    type: String,
  },
  userName: {
    type: String,
  },
  metadata: {
    type: mongoose.SchemaTypes.Mixed,
  },
  status: {
    type: String,
  },
  pageCount: {
    type: Number,
  },
  blobPath: {
    type: String,
  },
  notes: {
    type: String,
  },

  isDeleted: {
    type: String,
    default: false,
  },

  createdAt: {
    type: String,
    default: new Date(),
  },

  updatedAt: {
    type: String,
  },
});

const DocumentCollection = new mongoose.model("document", documentSchema);

export default DocumentCollection;
