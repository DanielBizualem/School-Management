import { StudentProfile } from "../models/StudentProfile.js";
import { StaffProfile } from "../models/staffProfile.js";

export const getSystemAnalytics = async () => {
    const totalStudents = await StudentProfile.countDocuments();
    const totalTeachers = await StaffProfile.countDocuments();
    
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
    const teacher = await StaffProfile.findById(teacherId);
    if (!teacher) throw new Error("TEACHER_NOT_FOUND");

    teacher.attendanceLog.push({ date: new Date(date), isPresent });
    await teacher.save();
    return teacher;
};

export const generateGlobalRoster = async () => {
    return await StudentProfile.find({}, "fullName rollNumber grades")
        .populate("grades.course", "courseName courseCode");
};

export const getStrugglingCoursesByGrade = async () => {
    const analytics = await StudentProfile.aggregate([
        // 1. Deconstruct the grades array so we can inspect individual marks
        { $unwind: "$grades" },
        
        // 2. Group by grade level AND course to calculate average mark
        {
            $group: {
                _id: {
                    gradeLevel: "$gradeLevel",
                    courseId: "$grades.course"
                },
                averageMark: { $avg: "$grades.mark" }
            }
        },
        
        // 3. Populate course names so the graph can display "Algebra" instead of a random ID
        {
            $lookup: {
                from: "courses", // name of your course collection in MongoDB
                localField: "_id.courseId",
                foreignField: "_id",
                as: "courseInfo"
            }
        },
        { $unwind: "$courseInfo" },
        
        // 4. Sort ascending so the worst averages (struggling) are first
        { $sort: { "averageMark": 1 } },
        
        // 5. Regroup purely by Grade Level and push the sorted courses into a list
        {
            $group: {
                _id: "$_id.gradeLevel",
                strugglingCourses: {
                    $push: {
                        courseName: "$courseInfo.courseName",
                        courseCode: "$courseInfo.courseCode",
                        averageScore: { $round: ["$averageMark", 1] }
                    }
                }
            }
        },
        
        // 6. Project only the top 2 struggling courses for each grade level
        {
            $project: {
                _id: 0,
                gradeLevel: "$_id",
                courses: { $slice: ["$strugglingCourses", 2] }
            }
        }
    ]);

    return analytics;
};