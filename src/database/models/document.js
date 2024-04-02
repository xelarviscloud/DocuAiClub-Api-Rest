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

const Location = new mongoose.model("document", documentSchema);

export default Location;
