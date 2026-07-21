import mongoose from "mongoose";

const classSectionSchema = new mongoose.Schema({
    sectionName: { type: String, required: true }, // e.g., "10th Grade Section A"
    gradeLevel: { 
        type: String, 
        required: true, 
        enum: ["9", "10", "11", "12"] 
    },
    homeroomTeacher: { type: mongoose.Schema.Types.ObjectId, ref: "StaffProfile" }
}, { timestamps: true });

export const ClassSection = mongoose.model("ClassSection", classSectionSchema);