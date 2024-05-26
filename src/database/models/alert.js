import mongoose from "mongoose";

const alertSchema = new mongoose.Schema({
  userId: {
    type: mongoose.SchemaTypes.ObjectId,
  },

  userName: {
    type: String,
  },

  type: {
    type: String,
  },

  description: {
    type: String,
  },

  organizationId: {
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

const AlertCollection = new mongoose.model("alert", alertSchema);

export default AlertCollection;
