import { StudentProfile } from "../models/StudentProfile.js";
import { StaffProfile } from "../models/staffProfile.js";
import { generateReportComment } from "./aiService.js";
import mongoose from "mongoose";
import { User } from "../models/User.js";
import bcrypt from "bcrypt";
import crypto from "crypto";
import {CourseGradeConfig} from "../models/CourseGradeConfig.js";

export const submitStudentMark = async (teacherUserId, payload) => {
    const { studentId, courseId, sectionId, semester, assessments } = payload;

    // 1. Authorization: Ensure this specific teacher teaches this course
    const teacherProfile = await StaffProfile.findOne({ user: teacherUserId });
    
    if (!teacherProfile || !teacherProfile.assignedCourses.map(id => id.toString()).includes(courseId)) {
        throw new Error("UNAUTHORIZED_COURSE_ACCESS");
    }

    // 2. Validate student exists
    const student = await StudentProfile.findById(studentId);
    if (!student) throw new Error("STUDENT_NOT_FOUND");

    // 3. Find the specific CourseGradeConfig document for this section & semester
    let gradeConfig = await CourseGradeConfig.findOne({
        course: courseId,
        section: sectionId,
        semester: semester || "semester1"
    });

    if (!gradeConfig) {
        throw new Error("COURSE_GRADE_CONFIG_NOT_FOUND");
    }

    // 4. Format incoming scores, validating them against the *actual* max scores defined in gradeConfig
    const formattedScores = assessments.map(item => {
        // Find the corresponding maxScore configuration for this assessment title
        const matchedAssessmentConfig = gradeConfig.assessments.find(
            a => a.title.toLowerCase().trim() === item.title.toLowerCase().trim()
        );

        const allowedMaxScore = matchedAssessmentConfig ? matchedAssessmentConfig.maxScore : 100;
        let finalScore = Number(item.score) || 0;

        // Optional safety: Prevent score from exceeding max score
        if (finalScore > allowedMaxScore) {
            finalScore = allowedMaxScore;
        }

        return {
            assessmentTitle: item.title,
            score: finalScore
        };
    });

    // 5. Update or push the student's scores into the `studentScores` array
    const studentScoreIndex = gradeConfig.studentScores.findIndex(
        (s) => String(s.student) === String(studentId)
    );

    if (studentScoreIndex > -1) {
        gradeConfig.studentScores[studentScoreIndex].scores = formattedScores;
    } else {
        gradeConfig.studentScores.push({
            student: studentId,
            scores: formattedScores
        });
    }

    // 6. Save changes to the CourseGradeConfig document
    await gradeConfig.save();

    // Populate course details so the returned object is fully fleshed out
    await gradeConfig.populate('course', 'courseName courseCode');

    return gradeConfig;
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