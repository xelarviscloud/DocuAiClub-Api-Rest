import mongoose from "mongoose";

const locationSchema = new mongoose.Schema({
  locationId: {
    type: String,
  },

  locationOrgId: {
    type: String,
  },

  locationName: {
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

  isDeleted: {
    type: String,
    default: false,
  },

  isDisable: {
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

const Location = new mongoose.model("location", locationSchema);

export default Location;
