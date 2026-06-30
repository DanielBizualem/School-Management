// Inside models/StudentProfile.js
import mongoose from "mongoose";

const studentProfileSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    fullName: { type: String, required: true },
    studentID: { type: String, required: true, unique: true },
    gradeLevel: { 
        type: String, 
        required: true, 
        enum: ["9th Grade", "10th Grade", "11th Grade", "12th Grade"] 
    },
    gender: {
        type: String,
        required: true,
        enum: ["Male", "Female"]
    },
    
    // ADD THIS FIELD: Linking the Parent Document Reference
    familyProfile: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: "ParentProfile", 
        required: true 
    },

    enrolledCourses: [{ type: mongoose.Schema.Types.ObjectId, ref: "Course" }],
    grades: [{
        course: { type: mongoose.Schema.Types.ObjectId, ref: "Course" },
        mark: { type: Number }
    }]
}, { timestamps: true });

export const StudentProfile = mongoose.model("StudentProfile", studentProfileSchema);