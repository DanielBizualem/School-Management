// models/ParentProfile.js
import mongoose from "mongoose";

const parentProfileSchema = new mongoose.Schema({
    // ADD THIS: Link to the Auth User
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    fullName: { type: String, required: true, trim: true },
    familyPhoto: { type: String },
    familyPersonDob: { type: Date },
    phoneNumber: { type: String, required: true },
    jobType: { type: String, required: true },
    address: { type: String, required: true },
    relation: { 
        type: String, 
        required: true, 
        enum: ["Father", "Mother", "Guardian", "Other"] 
    }
}, { timestamps: true });

export const ParentProfile = mongoose.models.ParentProfile || mongoose.model("ParentProfile", parentProfileSchema);