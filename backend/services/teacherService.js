import { StudentProfile } from "../models/StudentProfile.js";
import { TeacherProfile } from "../models/TeacherProfile.js";
import { generateReportComment } from "./aiService.js";

export const submitStudentMark = async (teacherUserId, { studentId, courseId, mark }) => {
    // 1. Authorization: Ensure this specific teacher teaches this course
    const teacherProfile = await TeacherProfile.findOne({ user: teacherUserId });
    
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