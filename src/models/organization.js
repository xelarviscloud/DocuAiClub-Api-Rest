import mongoose from "mongoose"

const organizationSchema = new mongoose.Schema({

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

    isDisable: {
        type: String,
        default: false
    },

    isDeleted: {
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

const Organization = new mongoose.model("organization", organizationSchema)

export default Organization 
