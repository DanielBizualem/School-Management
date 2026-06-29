import mongoose from "mongoose";

const courseSchema = new mongoose.Schema({
    courseName: { type: String, required: true },
    courseCode: { type: String, required: true, unique: true },
    teacher: { type: mongoose.Schema.Types.ObjectId, ref: "TeacherProfile" }
}, { timestamps: true });

export const Course = mongoose.models.Course || mongoose.model("Course", courseSchema);