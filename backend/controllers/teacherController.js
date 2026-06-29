import { submitStudentMark } from "../services/teacherService.js";

export const updateStudentGrade = async (req, res) => {
    try {
        const teacherUserId = req.user.id; // From your JWT auth middleware
        const { studentId, courseId, mark } = req.body;

        // Basic validation
        if (!studentId || !courseId || mark === undefined) {
            return res.status(400).json({ message: "Student ID, Course ID, and Mark are all required." });
        }

        // Execute the service for the individual student
        const updatedStudent = await submitStudentMark(teacherUserId, { studentId, courseId, mark });

        res.status(200).json({ 
            message: `Mark updated successfully for student ${updatedStudent.fullName}`, 
            grades: updatedStudent.grades 
        });

    } catch (err) {
        if (err.message === "UNAUTHORIZED_COURSE_ACCESS") {
            return res.status(403).json({ message: "You are not assigned to teach this course." });
        }
        if (err.message === "STUDENT_NOT_FOUND") {
            return res.status(404).json({ message: "The specified student profile does not exist." });
        }
        
        res.status(500).json({ message: "Server error updating grade", error: err.message });
    }
};