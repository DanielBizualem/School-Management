// models/StudentMark.js
import mongoose from "mongoose";

const studentMarkSchema = new mongoose.Schema({
    student: { type: mongoose.Schema.Types.ObjectId, ref: "Student", required: true },
    course: { type: mongoose.Schema.Types.ObjectId, ref: "Course", required: true },
    teacher: { type: mongoose.Schema.Types.ObjectId, ref: "StaffProfile", required: true }, // The teacher who graded
    term: { type: String, required: true }, // e.g., "Semester 1"
    marks: {
        exam: { type: Number, required: true },
        assignment: { type: Number, required: true },
        total: { type: Number, required: true }
    },
    remarks: { type: String }
}, { timestamps: true });

export const StudentMark = mongoose.models.StudentMark || mongoose.model("StudentMark", studentMarkSchema);