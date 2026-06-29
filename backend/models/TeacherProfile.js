import mongoose from "mongoose";

const teacherProfileSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    fullName: { type: String, required: true },
    phone: { type: String, required: true },
    department: { type: String, required: true },
    assignedCourses: [{ type: mongoose.Schema.Types.ObjectId, ref: "Course" }],
    attendanceLog: [{
        date: { type: Date, required: true },
        isPresent: { type: Boolean, required: true }
    }]
}, { timestamps: true });

export const TeacherProfile = mongoose.models.TeacherProfile || mongoose.model("TeacherProfile", teacherProfileSchema);