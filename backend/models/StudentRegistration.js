// models/StudentRegistration.js
import mongoose from "mongoose";

const studentRegistrationSchema = new mongoose.Schema({
    student: { type: mongoose.Schema.Types.ObjectId, ref: "StudentProfile", required: true },
    academicYear: { type: String, required: true },
    targetGrade: { type: String, required: true },
    status: { 
        type: String, 
        enum: ["Pending", "Approved", "Rejected"], 
        default: "Pending" 
    }
}, { timestamps: true });

export const StudentRegistration = mongoose.models.StudentRegistration || mongoose.model("StudentRegistration", studentRegistrationSchema);