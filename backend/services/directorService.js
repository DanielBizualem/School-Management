import { StudentProfile } from "../models/StudentProfile.js";
import { TeacherProfile } from "../models/TeacherProfile.js";

export const getSystemAnalytics = async () => {
    const totalStudents = await StudentProfile.countDocuments();
    const totalTeachers = await TeacherProfile.countDocuments();
    
    // Aggregating global average performance
    const gradeStats = await StudentProfile.aggregate([
        { $unwind: "$grades" },
        { $group: { _id: null, avgMark: { $avg: "$grades.mark" } } }
    ]);

    return {
        totalStudents,
        totalTeachers,
        globalAverageMark: gradeStats[0]?.avgMark || 0
    };
};

export const trackTeacherAttendance = async (teacherId, { date, isPresent }) => {
    const teacher = await TeacherProfile.findById(teacherId);
    if (!teacher) throw new Error("TEACHER_NOT_FOUND");

    teacher.attendanceLog.push({ date: new Date(date), isPresent });
    await teacher.save();
    return teacher;
};

export const generateGlobalRoster = async () => {
    return await StudentProfile.find({}, "fullName rollNumber grades")
        .populate("grades.course", "courseName courseCode");
};