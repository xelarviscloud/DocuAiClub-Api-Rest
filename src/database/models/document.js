import mongoose from "mongoose";

const documentSchema = new mongoose.Schema({
  locationId: {
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
    type: Number,
    default: new Date(),
  },

  updatedAt: {
    type: Number,
  },
});

const DocumentCollection = new mongoose.model("document", documentSchema);

export default DocumentCollection;
