import { StudentProfile } from "../models/StudentProfile.js";
import { TeacherProfile } from "../models/TeacherProfile.js";

export const submitStudentMark = async (teacherUserId, { studentId, courseId, mark }) => {
    // 1. Authorization: Ensure this specific teacher teaches this course
    const teacherProfile = await TeacherProfile.findOne({ user: teacherUserId });
    if (!teacherProfile || !teacherProfile.assignedCourses.includes(courseId)) {
        throw new Error("UNAUTHORIZED_COURSE_ACCESS");
    }

    // 2. Find the specific student being graded
    const student = await StudentProfile.findById(studentId);
    if (!student) throw new Error("STUDENT_NOT_FOUND");

    // 3. Find if the student already has a grade entry for this specific course
    const gradeIndex = student.grades.findIndex(g => g.course.toString() === courseId);

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