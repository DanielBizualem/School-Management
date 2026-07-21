import mongoose from "mongoose";
import { StudentProfile } from "./StudentProfile.js";
//import { ClassSection } from "./classSection.js";

const courseSchema = new mongoose.Schema({
    courseName: { type: String, required: true },
    courseCode: { type: String, required: true, unique: true },
    gradeLevels: { 
        type: [String], 
        required: true, 
        enum: ["9", "10", "11", "12"] 
    },
}, { timestamps: true });

courseSchema.post('save', async function(doc, next) {
    try {
        // 1. Update existing student profiles to include this course with separate semester grades
        await StudentProfile.updateMany(
            { gradeLevel: { $in: doc.gradeLevels } },
            { 
                $push: { 
                    grades: { 
                        course: doc._id, 
                        semester1Mark: 0, 
                        semester2Mark: 0 
                    } 
                } 
            }
        );

       
        next();
    } catch (error) {
        next(error);
    }
});

export const Course = mongoose.models.Course || mongoose.model("Course", courseSchema);