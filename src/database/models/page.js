import mongoose from "mongoose";

const pageSchema = new mongoose.Schema({
  locationId: {
    type: String,
  },
  organizationId: {
    type: String,
  },
  documentId: {
    type: mongoose.SchemaTypes.ObjectId,
  },
  data: {
    type: mongoose.SchemaTypes.Mixed,
  },
  pageName: {
    type: String,
  },
  pageBlobPath: {
    type: String,
  },
  documentName: {
    type: String,
  },
  sortId: {
    type: Number,
  },
  locationId: {
    type: String,
  },
  userId: {
    type: String,
  },
  userName: {
    type: String,
  },

  createdAt: {
    type: Date,
    default: new Date(),
  },

  updatedAt: {
    type: Date,
  },
});

const PageCollection = new mongoose.model("page", pageSchema);

export default PageCollection;
