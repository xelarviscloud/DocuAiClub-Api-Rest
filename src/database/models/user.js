import mongoose from "mongoose";
import hashPassword from "../../services/encryption/hashPassword.js";

const UserSchema = new mongoose.Schema({
  userName: {
    type: String,
  },

  password: {
    type: String,
  },

  role: {
    type: String,
  },

  userOrganizationId: {
    type: String,
  },

  userLocationId: {
    type: String,
  },

  firstName: {
    type: String,
  },

  lastName: {
    type: String,
  },

  phoneNumber: {
    type: String,
  },
  emailAddress: {
    type: String,
  },

  notes: {
    type: String,
  },
  fileUrl: {
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

UserSchema.pre("save", async function (next) {
  try {
    // Hash the password fields before saving
    this.password = hashPassword(this.password);
    return next();
  } catch (error) {
    console.log(error);
    return next();
  }
});

UserSchema.pre("update", async function (next) {
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
