import mongoose from "mongoose";

const classSectionSchema = new mongoose.Schema({
    sectionName: { 
        type: String, 
        required: true, 
        trim: true 
    },
    courses: [{
        course: { 
            type: mongoose.Schema.Types.ObjectId, 
            ref: "Course", 
            required: true
        },
        academicYear: { 
            type: String, 
            required: true
        },
        teacher: { 
            type: mongoose.Schema.Types.ObjectId, 
            ref: "StaffProfile", 
            required: true 
        }
    }],
    gradeLevel: { 
        type: String, 
        required: true, 
        enum: ["9", "10", "11", "12"] 
    },
    students: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "StudentProfile" // Points to student user accounts assigned to this section
    }]
}, { timestamps: true });

// Optional: If you want to ensure unique section names per grade level globally, use this instead:
classSectionSchema.index({ sectionName: 1, gradeLevel: 1 }, { unique: true });

export const ClassSection = mongoose.models.ClassSection || mongoose.model("ClassSection", classSectionSchema);