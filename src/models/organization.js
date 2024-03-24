import mongoose from "mongoose";

const organizationSchema = new mongoose.Schema({
  organizationId: {
    type: String,
  },

  organizationName: {
    type: String,
  },

  phoneNumber: {
    type: String,
  },

  emailAddress: {
    type: String,
  },

  addressLine1: {
    type: String,
  },

  addressLine2: {
    type: String,
  },

  state: {
    type: String,
  },

  city: {
    type: String,
  },

  zipCode: {
    type: String,
  },

  notes: {
    type: String,
  },

  isDisable: {
    type: String,
    default: false,
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

const Organization = new mongoose.model("Organization", organizationSchema);

export default Organization;
