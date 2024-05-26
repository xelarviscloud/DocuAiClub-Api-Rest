import mongoose from "mongoose";

const UserAlertSchema = new mongoose.Schema({
  alertId: {
    type: mongoose.SchemaTypes.ObjectId,
  },

  receiverId: {
    type: mongoose.SchemaTypes.ObjectId,
  },

  status: {
    type: Number,
    default: 0,
  },

  createdAt: {
    type: Date,
    default: new Date(),
  },

  updatedAt: {
    type: Date,
  },
});

const UserAlertCollection = new mongoose.model("UserAlert", UserAlertSchema);

export default UserAlertCollection;
