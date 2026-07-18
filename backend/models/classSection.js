
import mongoose from "mongoose";

const classSectionSchema = new mongoose.Schema({
    course: { type: mongoose.Schema.Types.ObjectId, ref: "Course", required: true },
    gradeLevel: { type: String, required: true },
    teacher: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: "StaffProfile",
        default: null
    },
    academicYear: { type: String, required: true }
});

export const ClassSection = mongoose.models.ClassSection || mongoose.model("ClassSection", classSectionSchema);