// models/AcademicYearConfig.js
import mongoose from "mongoose";

const academicYearConfigSchema = new mongoose.Schema({
    academicYear: { type: String, required: true },
    isRegistrationOpen: { type: Boolean, default: false },
    targetGrade: { type: String, required: true } // e.g., "Grade 10" or "All"
}, { timestamps: true });

export const AcademicYearConfig = mongoose.models.AcademicYearConfig || mongoose.model("AcademicYearConfig", academicYearConfigSchema);