// models/StaffProfile.js
import mongoose from "mongoose";

const staffProfileSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    role: { type: String, enum: ["teacher", "director"], required: true },
    employeeID: { type: String, required: true, unique: true },
    salary: { type: Number, required: true },

    // Expanded Personal Info
    personalInfo: {
        fullName: { type: String, required: true, trim: true },
        birthday: { type: Date, required: true },
        department: { type: String, required: true },
        nationality: { type: String, required: true },
        gender: { type: String, enum: ["Male", "Female"], required: true },
        maritalStatus: { type: String, enum: ["Single", "Married", "Divorced", "Widowed"], required: true },
    },

    // Contact Address
    contactAddress: {
        city: { type: String, required: true },
        phoneNumber: { type: String, required: true },
        email: { type: String, required: true },
        kebele: { type: String, required: true }
    },

    // Education & Experience
    education: { completionLevel: { type: String } },
    experience: { type: String }, // Can be a string summary or an array of objects

    // Emergency Contact
    emergencyContact: {
        fullName: { type: String, required: true },
        city: { type: String, required: true },
        phoneNumber: { type: String, required: true },
        relationship: { type: String, required: true }
    },
    status: {
        type: String,
        enum: ['Current', 'Leave'],
        default: 'Current'
      },

    assignedCourses: [{ type: mongoose.Schema.Types.ObjectId, ref: "Course" }]
}, { timestamps: true });

export const StaffProfile = mongoose.models.StaffProfile || mongoose.model("StaffProfile", staffProfileSchema);