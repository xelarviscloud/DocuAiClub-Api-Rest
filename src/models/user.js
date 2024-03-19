import mongoose from "mongoose";
import hashPassword from "../services/encryption/hashpassword.js";

const UserSchema = new mongoose.Schema({
  organizationid: {
    type: String,
  },

  locationid: {
    type: String,
  },

  organizationuserid: {
    type: String,
  },

  locationuserid: {
    type: String,
  },

  username: {
    type: String,
  },

  name: {
    type: String,
  },

  firstname: {
    type: String,
  },

  lastname: {
    type: String,
  },

  mobile_number: {
    type: String,
  },

  email: {
    type: String,
  },

  password: {
    type: String,
  },

  address_line1: {
    type: String,
  },

  address_line2: {
    type: String,
  },

  state: {
    type: String,
  },

  city: {
    type: String,
  },

  zip_code: {
    type: String,
  },

  notes: {
    type: String,
  },

  parent_organization: {
    type: String,
  },

  parent_location: {
    type: String,
  },

  role: {
    type: String,
  },

  fileurl: {
    type: String,
  },

  is_verified: {
    type: String,
    default: false,
  },

  is_default: {
    type: String,
    default: false,
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

UserSchema.pre("save", async function (next) {
  try {
    // Hash the password fields before saving
    this.password = await hashPassword(this.password);
    return next();
  } catch (error) {
    console.log(error);
    return next();
  }
});

const UserCollection = new mongoose.model("User", UserSchema);

export default UserCollection;
