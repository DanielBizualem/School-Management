// controllers/markController.js
import { StudentMark } from "../models/studentMark.js";
import { StaffProfile } from "../models/staffProfile.js";

export const insertStudentMark = async (req, res) => {
    try {
        const { studentId, courseId, marks, term } = req.body;
        const teacherId = req.user.staffId; // Populated by auth middleware

        // 1. Verify if the teacher is actually assigned to this course
        const teacher = await StaffProfile.findById(teacherId);
        if (!teacher || !teacher.assignedCourses.includes(courseId)) {
            return res.status(403).json({ message: "You are not authorized to grade this course." });
        }

        // 2. Create the mark entry
        const newMark = await StudentMark.create({
            student: studentId,
            course: courseId,
            teacher: teacherId,
            term,
            marks: {
                exam: marks.exam,
                assignment: marks.assignment,
                total: marks.exam + marks.assignment
            }
        });

        res.status(201).json({ message: "Marks saved successfully", data: newMark });
    } catch (error) {
        res.status(500).json({ message: "Error saving marks", error: error.message });
    }
};