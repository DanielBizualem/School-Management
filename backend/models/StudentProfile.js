
import mongoose from "mongoose";

const studentProfileSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    fullName: { type: String, required: true },
    studentID: { type: String, required: true, unique: true },
    studentPhoto: { type: String },
    studentDob: { type: Date },
    academicYear: String,
    gradeLevel: { 
        type: String,
        required: true,
        enum: ["9", "10", "11", "12"] 
    },
    gender: {
        type: String,
        required: true,
        enum: ["Male", "Female"]
    },
    
    
    familyProfile: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: "ParentProfile",
        required: true 
    },

    enrolledSections: [{ type: mongoose.Schema.Types.ObjectId, ref: "ClassSection" }],

    //points related to the course for the student
    grades: [{
        course: { type: mongoose.Schema.Types.ObjectId, ref: "Course" },
        semester1Mark: { type: Number, default: 0, min: 0, max: 100 },
        semester2Mark: { type: Number, default: 0, min: 0, max: 100 },
        assessments: [{
            title: { type: String, required: true },
            score: { type: Number, required: true, default: 0 },
            maxScore: { type: Number, required: true, default: 10 }
        }]
    }]
}, { timestamps: true });


export const StudentProfile = mongoose.models.StudentProfile || mongoose.model("StudentProfile", studentProfileSchema);