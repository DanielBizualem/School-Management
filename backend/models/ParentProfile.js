import mongoose from "mongoose";

const parentProfileSchema = new mongoose.Schema({
    fullName: { 
        type: String, 
        required: true, 
        trim: true 
    },
    phoneNumber: { 
        type: String, 
        required: true 
    },
    jobType: { 
        type: String, 
        required: true, 
        placeholder: "e.g., Engineer, Trader, Teacher" 
    },
    address: { 
        type: String, 
        required: true 
    },
    relation: { 
        type: String, 
        required: true, 
        enum: ["Father", "Mother", "Guardian", "Other"] 
    }
}, { timestamps: true });

export const ParentProfile = mongoose.model("ParentProfile", parentProfileSchema);