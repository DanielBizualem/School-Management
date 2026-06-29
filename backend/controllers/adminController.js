import { createTeacherAccount, createDirectorAccount, createNewCourse } from "../services/adminService.js";
import { createStudentAccount } from "../services/studentService.js";

export const registerStudent = async (req, res) => {
    try {
        const data = await createStudentAccount(req.body);
        res.status(201).json({ message: "Student registered!", data });
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

export const registerTeacher = async (req, res) => {
    try {
        const data = await createTeacherAccount(req.body);
        res.status(201).json({ message: "Teacher registered!", data });
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

export const registerDirector = async (req, res) => {
    try {
        const data = await createDirectorAccount(req.body);
        res.status(201).json({ message: "Director registered!", data });
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

export const addCourse = async (req, res) => {
    try {
        // req.body expects: { "courseName": "...", "courseCode": "...", "teacherId": "..." }
        const course = await createNewCourse(req.body);
        
        res.status(201).json({ 
            message: "Course created successfully and assigned to the teacher.", 
            course 
        });
    } catch (err) {
        if (err.message === "COURSE_CODE_EXISTS") {
            return res.status(400).json({ message: "This course code already exists." });
        }
        if (err.message === "TEACHER_NOT_FOUND") {
            return res.status(404).json({ message: "The specified teacher profile was not found." });
        }
        
        res.status(500).json({ message: "Server error configuring course", error: err.message });
    }
};