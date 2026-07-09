// models/StaffProfile.js
import mongoose from "mongoose";

const staffProfileSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    role: { type: String, enum: ["teacher", "director"], required: true },
    fullName: { type: String, required: true, trim: true },
    phoneNumber: { type: String, required: true },
    department: { type: String, required: true },
    employeeID: { type: String, required: true, unique: true },

    // Financial Information
    salary: { type: Number, required: true},

    // Teacher-Specific Fields
    assignedCourses: [{ type: mongoose.Schema.Types.ObjectId, ref: "Course" }],
    attendanceLog: [{
        date: { type: Date, required: true },
        isPresent: { type: Boolean, required: true }
    }],

    // Director-Specific Fields
    officeLocation: { type: String }
}, { timestamps: true });

export const StaffProfile = mongoose.models.StaffProfile || mongoose.model("StaffProfile", staffProfileSchema);