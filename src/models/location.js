import mongoose from "mongoose"

const locationSchema = new mongoose.Schema({

    locationid: {
        type: String
    },

    organizationid: {
        type: String
    },

    name: {
        type: String
    },

    phone_number: {
        type: String
    },

    email: {
        type: String
    },

    address_line1: {
        type: String
    },

    address_line2: {
        type: String
    },

    state: {
        type: String
    },

    city: {
        type: String
    },

    zip_code: {
        type: String
    },

    notes: {
        type: String
    },

    isDeleted: {
        type: String,
        default: false
    },

    isDisable: {
        type: String,
        default: false
    },

    createdAt: {
        type: Number,
        default: new Date()
    },

    updatedAt: {
        type: Number
    }

})

const Location = new mongoose.model("location", locationSchema)

export default Location
