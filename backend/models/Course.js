import mongoose from "mongoose";
import { StudentProfile } from "./StudentProfile.js";

const courseSchema = new mongoose.Schema({
    courseName: { type: String, required: true },
    courseCode: { type: String, required: true, unique: true },
    gradeLevel: { type: [String], required: true }
}, { timestamps: true });

courseSchema.post('save', async function(doc, next) {
    try {
        // Find students whose gradeLevel exists in the new course's gradeLevel array
        const studentsToUpdate = await StudentProfile.find({
            gradeLevel: { $in: doc.gradeLevel }
        });

        if (studentsToUpdate.length > 0) {
            // Bulk update to push the new course into their grades array
            await StudentProfile.updateMany(
                { gradeLevel: { $in: doc.gradeLevel } },
                { 
                    $push: { 
                        grades: { course: doc._id, mark: 0 } // Initialize mark to 0 or null
                    } 
                }
            );
        }
        next();
    } catch (error) {
        next(error);
    }
});

export const Course = mongoose.models.Course || mongoose.model("Course", courseSchema);