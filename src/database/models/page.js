import mongoose from "mongoose";

const pageSchema = new mongoose.Schema({
  locationId: {
    type: String,
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
    type: Number,
    default: new Date(),
  },

  updatedAt: {
    type: Number,
  },
});

const PageCollection = new mongoose.model("page", pageSchema);

export default PageCollection;
