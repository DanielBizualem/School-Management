import { StudentProfile } from "../models/StudentProfile.js";
import { StaffProfile } from "../models/staffProfile.js";
import { generateReportComment } from "./aiService.js";
import mongoose from "mongoose";
import { User } from "../models/User.js";
import bcrypt from "bcrypt";
import crypto from "crypto";

export const submitStudentMark = async (teacherUserId, { studentId, courseId, mark }) => {
    // 1. Authorization: Ensure this specific teacher teaches this course
    const teacherProfile = await StaffProfile.findOne({ user: teacherUserId });
    
    // Using .toString() handles Mongoose ObjectIds safely when doing comparison checks
    if (!teacherProfile || !teacherProfile.assignedCourses.map(id => id.toString()).includes(courseId)) {
        throw new Error("UNAUTHORIZED_COURSE_ACCESS");
    }

    // 2. Find the specific student being graded
    const student = await StudentProfile.findById(studentId);
    if (!student) throw new Error("STUDENT_NOT_FOUND");

    // 3. Find if the student already has a grade entry for this specific course
    const gradeIndex = student.grades.findIndex(g => g.course.toString() === courseId);

    // FIXED BUG: Explicitly checking against -1 ensures index 0 updates correctly
    if (gradeIndex > -1) {
        // If entry exists, update the existing mark
        student.grades[gradeIndex].mark = mark;
    } else {
        // If it's a first-time mark, push a new course-grade pair
        student.grades.push({ course: courseId, mark });
    }

    // 4. Save changes only for this specific student
    await student.save();
    return student;
};

export const getAIStudentEvaluation = async (studentId, courseId) => {
    // 1. Fetch the student profile and look up their specific grade for this course
    const student = await StudentProfile.findById(studentId);
    if (!student) throw new Error("STUDENT_NOT_FOUND");

    const course = await Course.findById(courseId);
    if (!course) throw new Error("COURSE_NOT_FOUND");

    // Find the specific grade object inside the student's grade array
    const gradeRecord = student.grades.find(g => g.course.toString() === courseId);
    const currentMark = gradeRecord ? gradeRecord.mark : null;

    if (currentMark === null) {
        throw new Error("NO_GRADE_RECORDED_YET");
    }

    // 2. Pass the real database values straight into your AI generator
    const aiComment = await generateReportComment({
        studentName: student.fullName,
        courseName: course.courseName,
        mark: currentMark
    });

    return {
        studentName: student.fullName,
        courseName: course.courseName,
        currentMark,
        evaluation: aiComment
    };
};

// Helper to generate the ID
const generateEmployeeID = async () => {
    const year = new Date().getFullYear().toString().slice(-2); // "26"
    
    // Count how many staff profiles exist to get the next number
    const count = await StaffProfile.countDocuments();
    const sequence = (count + 1).toString().padStart(4, '0'); // "0001"
    
    return `EMP${sequence}/${year}`;
};

export const registerTeacher = async (teacherData) => {
    const rawPassword = crypto.randomBytes(8).toString('hex');
    const hashedPassword = await bcrypt.hash(rawPassword, 10);
    
    const year = new Date().getFullYear().toString().slice(-2);
    const count = await StaffProfile.countDocuments({});
    const employeeID = `EMP/${(count + 1).toString().padStart(4, '0')}/${year}`;

    const newUser = await User.create({
        employeeID,
        password: hashedPassword,
        role: "teacher"
    });

    const newProfile = await StaffProfile.create({
        user: newUser._id,
        role: "teacher",
        employeeID,
        salary: teacherData.salary,
        personalInfo: teacherData.personalInfo,
        contactAddress: teacherData.contactAddress,
        education: teacherData.education,
        experience: teacherData.experience,
        emergencyContact: teacherData.emergencyContact
    });

    return { teacher: newProfile, credentials: { employeeID, password: rawPassword } };
};

export const getAllTeachers = async () => {
    return await StaffProfile.find({ role: 'teacher' }).populate('user', 'email');
};