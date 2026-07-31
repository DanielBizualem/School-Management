import { getSystemAnalytics, trackTeacherAttendance, generateGlobalRoster,getStrugglingCoursesByGrade } from "../services/directorService.js";
import {ClassSection} from '../models/classSection.js'
import mongoose from "mongoose";
import { User } from "../models/User.js";
import bcrypt from "bcryptjs";
import { DirectorProfile } from "../models/directorProfile.js";
import { Course } from "../models/Course.js";
import {CourseGradeConfig} from '../models/CourseGradeConfig.js'
import { StudentProfile } from "../models/StudentProfile.js";


export const createDirector = async (req, res) => {
    const { email, password, fullName, employeeID, phoneNumber } = req.body;

    // Start a Mongoose session for the transaction
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        // 1. Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            await session.abortTransaction();
            return res.status(400).json({ message: "Email already registered" });
        }

        // 2. Hash the password
        const hashedPassword = await bcrypt.hash(password, 12);

        // 3. Create the User (Auth record with role set to "director")
        const newUser = await User.create([{
            email,
            password: hashedPassword,
            role: "director"
        }], { session });

        // 4. Create the Director Profile record
        await DirectorProfile.create([{
            user: newUser[0]._id,
            fullName,
            employeeID,
            phoneNumber,
        }], { session });

        // Commit the transaction
        await session.commitTransaction();
        
        res.status(201).json({ message: "Director created successfully" });

    } catch (error) {
        // If anything fails, undo all changes
        await session.abortTransaction();
        res.status(500).json({ message: "Error creating director", error: error.message });
    } finally {
        session.endSession();
    }
};

export const viewDashboardAnalytics = async (req, res) => {
    try {
        // Run both service operations concurrently to keep response times fast
        const [metrics, strugglingCoursesData] = await Promise.all([
            getSystemAnalytics(),
            getStrugglingCoursesByGrade()
        ]);

        // Combine everything into a clean, unified response object
        return res.status(200).json({
            success: true,
            generalMetrics: metrics,                 // Your old analytics data stays intact
            strugglingCourses: strugglingCoursesData  // Your new grade-separated chart data
        });
    } catch (err) {
        return res.status(500).json({ 
            success: false, 
            error: err.message 
        });
    }
};

export const logTeacherAttendance = async (req, res) => {
    try {
        const { teacherId } = req.params;
        const log = await trackTeacherAttendance(teacherId, req.body);
        res.status(200).json({ message: "Attendance tracked successfully", log });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};

export const downloadRosterData = async (req, res) => {
    try {
        const roster = await generateGlobalRoster();
        res.status(200).json(roster);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

//recent added api's

export const assignHomeroomTeacher = async (req, res) => {
    try {
        const { sectionId } = req.params;
        const { teacherId } = req.body;

        const updatedSection = await ClassSection.findByIdAndUpdate(
            sectionId,
            { homeroomTeacher: teacherId },
            { new: true }
        ).populate({
            path: 'homeroomTeacher',
            select: 'fullName staffID' // Adjust fields based on your StaffProfile model structure
        });

        if (!updatedSection) {
            return res.status(404).json({ 
                success: false, 
                message: "Class section not found" 
            });
        }

        return res.status(200).json({
            success: true,
            message: "Homeroom teacher assigned successfully",
            data: updatedSection
        });

    } catch (error) {
        console.error("Error assigning homeroom teacher:", error);
        return res.status(500).json({ 
            success: false, 
            message: error.message 
        });
    }
};
export const getAllCourses = async (req, res) => {
    try {
        // Fetch all courses
        const courses = await Course.find({});

        res.status(200).json({
            success: true,
            count: courses.length,
            data: courses
        });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            message: "Error fetching courses", 
            error: error.message 
        });
    }
}

export const getDirectorAnalytics = async (req, res) => {
    try {
        const { academicYear, semester } = req.query;

        // 1. Fetch all sections and populate courses/students
        const sections = await ClassSection.find()
            .populate('students', '_id fullName')
            .populate('courses.course', '_id courseName');

        if (!sections || sections.length === 0) {
            return res.status(404).json({ success: false, message: "No sections found" });
        }

        // Fetch all grade configurations for the specified semester/academic year
        const gradeConfigs = await CourseGradeConfig.find({ semester });

        // Map courseId -> config for quick lookup
        const configMap = {};
        gradeConfigs.forEach(config => {
            configMap[config._id.toString()] = config;
        });

        let sectionPerformances = [];
        let globalCourseStats = {}; // courseId -> { courseName, totalScoreSum, count, passCount, failCount }

        // 2. Evaluate each section
        for (const section of sections) {
            const activeCourses = section.courses.filter(c => !academicYear || c.academicYear === academicYear);
            const courseIds = activeCourses.map(c => c.course?._id?.toString()).filter(Boolean);

            // Find grade configs belonging to this section
            const sectionConfigs = gradeConfigs.filter(
                cfg => cfg.section.toString() === section._id.toString() && courseIds.includes(cfg.course.toString())
            );

            let sectionTotalScore = 0;
            let sectionScoreCount = 0;

            sectionConfigs.forEach(config => {
                const courseIdStr = config.course.toString();
                const matchedCourse = activeCourses.find(c => c.course?._id?.toString() === courseIdStr);
                const courseName = matchedCourse?.course?.courseName || "Unknown Course";

                if (!globalCourseStats[courseIdStr]) {
                    globalCourseStats[courseIdStr] = {
                        courseName,
                        totalScore: 0,
                        studentCount: 0,
                        passCount: 0,
                        failCount: 0
                    };
                }

                const totalMaxScore = config.assessments.reduce((sum, a) => sum + a.maxScore, 0);

                config.studentScores.forEach(record => {
                    const totalEarned = record.scores.reduce((sum, s) => sum + s.score, 0);
                    let scoreOutOf100 = totalMaxScore > 0 ? (totalEarned / totalMaxScore) * 100 : 0;

                    sectionTotalScore += scoreOutOf100;
                    sectionScoreCount++;

                    // Global course aggregation
                    globalCourseStats[courseIdStr].totalScore += scoreOutOf100;
                    globalCourseStats[courseIdStr].studentCount++;

                    if (scoreOutOf100 >= 50) {
                        globalCourseStats[courseIdStr].passCount++;
                    } else {
                        globalCourseStats[courseIdStr].failCount++;
                    }
                });
            });

            const sectionAverage = sectionScoreCount > 0 ? (sectionTotalScore / sectionScoreCount) : 0;

            sectionPerformances.push({
                sectionId: section._id,
                sectionName: section.sectionName,
                gradeLevel: section.gradeLevel,
                averageScore: sectionAverage,
                totalStudents: section.students.length
            });
        }

        // 1. Which class/section performed best
        sectionPerformances.sort((a, b) => b.averageScore - a.averageScore);
        const bestClass = sectionPerformances[0] || null;

        // Process Global Course Performance
        let coursePerformanceArray = Object.keys(globalCourseStats).map(courseId => {
            const stat = globalCourseStats[courseId];
            const avg = stat.studentCount > 0 ? stat.totalScore / stat.studentCount : 0;
            return {
                courseId,
                courseName: stat.courseName,
                averageScore: avg,
                passCount: stat.passCount,
                failCount: stat.failCount,
                totalEvaluated: stat.studentCount,
                passRate: stat.studentCount > 0 ? (stat.passCount / stat.studentCount) * 100 : 0
            };
        });

        // 2. Best 3 courses in which many students passed (highest pass count / pass rate)
        const bestCourses = [...coursePerformanceArray]
            .sort((a, b) => b.passCount - a.passCount || b.averageScore - a.averageScore)
            .slice(0, 3);

        // 3. Least 3 courses in which many students failed (highest fail count / lowest pass rate)
        const worstCourses = [...coursePerformanceArray]
            .sort((a, b) => b.failCount - a.failCount || a.averageScore - b.averageScore)
            .slice(0, 3);

        // 4. Added Extra Metric: Overall School Pass Rate & Academic Health Distribution
        const totalEvaluatedStudents = coursePerformanceArray.reduce((sum, c) => sum + c.totalEvaluated, 0);
        const totalPasses = coursePerformanceArray.reduce((sum, c) => sum + c.passCount, 0);
        const overallSchoolPassRate = totalEvaluatedStudents > 0 ? (totalPasses / totalEvaluatedStudents) * 100 : 0;

        return res.status(200).json({
            success: true,
            data: {
                bestClass,
                bestCourses,
                worstCourses,
                additionalInsights: {
                    overallSchoolPassRate,
                    totalSectionsEvaluated: sections.length,
                    sectionRankings: sectionPerformances
                }
            }
        });

    } catch (error) {
        console.error("Error generating director analytics:", error);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
};

export const fetchStudentTranscriptData = async (studentId) => {
    if (!studentId) {
        throw new Error("Student ID is required.");
    }

    // Find the student by studentID (adjust query to match your database schema)
    const student = await StudentProfile.findOne({ studentID: studentId });
    if (!student) {
        throw new Error("Student transcript could not be found.");
    }

    // Fetch the student's academic years, courses, and grades records
    // (Replace this section with your exact database querying logic for grades/courses)
    const academicYears = await CourseGradeConfig.find({ student: student._id });

    // Format and return the full transcript structure expected by your frontend
    return {
        student: {
            _id: student._id,
            fullName: student.fullName,
            studentID: student.studentID,
            enrolledYear: student.enrolledYear
        },
        academicYears: academicYears || []
    };
};

export const getStudentTranscript = async (req, res) => {
    try {
        let rawStudentId = req.query.studentId;

        if (!rawStudentId) {
            return res.status(400).json({ 
                success: false, 
                message: "Student ID query parameter is required." 
            });
        }

        // Clean any accidental quotes or whitespace sent from the frontend input
        const studentId = rawStudentId.replace(/["']/g, '').trim();

        // 1. Search for student by custom string studentID or MongoDB ObjectId
        let studentQuery;
        if (studentId.match(/^[0-9a-fA-F]{24}$/)) {
            studentQuery = { $or: [{ _id: studentId }, { studentID: studentId }] };
        } else {
            studentQuery = { studentID: { $regex: new RegExp(`^${studentId}$`, 'i') } };
        }

        const student = await StudentProfile.findOne(studentQuery).lean();
        if (!student) {
            return res.status(404).json({ 
                success: false, 
                message: `Student not found with ID: ${studentId}` 
            });
        }

        const resolvedStudentId = student._id;

        // 2. Find all Class Sections where this student is enrolled
        const sections = await ClassSection.find({ students: resolvedStudentId })
            .populate('courses.course', 'courseName courseCode')
            .lean();

        if (!sections || sections.length === 0) {
            return res.status(200).json({
                success: true,
                data: {
                    student: {
                        _id: student._id,
                        fullName: student.fullName,
                        studentID: student.studentID,
                        enrolledYear: student.createdAt || student.enrolledYear
                    },
                    academicYears: []
                }
            });
        }

        // Map to group courses by Academic Year and Grade Level
        const transcriptMap = {};

        for (const section of sections) {
            for (const sectionCourse of section.courses) {
                const courseId = sectionCourse.course?._id || sectionCourse.course;
                const academicYear = sectionCourse.academicYear;
                const gradeLevel = section.gradeLevel;

                if (!academicYear) continue;

                if (!transcriptMap[academicYear]) {
                    transcriptMap[academicYear] = {
                        academicYear,
                        gradeLevel,
                        semesters: {
                            semester1: {},
                            semester2: {}
                        }
                    };
                }

                // Fetch grades for semester 1 and semester 2 from CourseGradeConfig
                for (const semester of ['semester1', 'semester2']) {
                    const gradeConfig = await CourseGradeConfig.findOne({
                        course: courseId,
                        section: section._id,
                        semester: semester
                    }).lean();

                    let courseTotalScore = 0;

                    if (gradeConfig) {
                        const studentScoreRecord = gradeConfig.studentScores?.find(
                            (s) => s.student.toString() === resolvedStudentId.toString()
                        );

                        if (studentScoreRecord && studentScoreRecord.scores) {
                            // Sum up scores achieved from assessments for 100% total
                            courseTotalScore = studentScoreRecord.scores.reduce(
                                (sum, assessment) => sum + (assessment.score || 0),
                                0
                            );
                        }
                    }

                    transcriptMap[academicYear].semesters[semester][courseId.toString()] = {
                        courseId,
                        courseName: sectionCourse.course?.courseName || "Unknown Course",
                        courseCode: sectionCourse.course?.courseCode || "",
                        score: courseTotalScore
                    };
                }
            }
        }

        // Format into a structured array for the frontend response
        const academicYearsFormatted = Object.values(transcriptMap).map((yearData) => {
            const courseIds = new Set([
                ...Object.keys(yearData.semesters.semester1),
                ...Object.keys(yearData.semesters.semester2)
            ]);

            const coursesList = Array.from(courseIds).map((cId) => {
                const sem1Item = yearData.semesters.semester1[cId];
                const sem2Item = yearData.semesters.semester2[cId];
                
                const courseName = sem1Item?.courseName || sem2Item?.courseName || "Course";
                const courseCode = sem1Item?.courseCode || sem2Item?.courseCode || "";
                
                const sem1Score = sem1Item ? sem1Item.score : null;
                const sem2Score = sem2Item ? sem2Item.score : null;

                let validScores = [];
                if (sem1Score !== null) validScores.push(sem1Score);
                if (sem2Score !== null) validScores.push(sem2Score);
                
                const yearlyAverage = validScores.length > 0 
                    ? validScores.reduce((a, b) => a + b, 0) / validScores.length 
                    : 0;

                return {
                    courseId: cId,
                    courseName,
                    courseCode,
                    semester1Score: sem1Score,
                    semester2Score: sem2Score,
                    yearlyAverage
                };
            });

            const totalYearScore = coursesList.reduce((acc, curr) => acc + curr.yearlyAverage, 0);
            const overallYearAverage = coursesList.length > 0 ? totalYearScore / coursesList.length : 0;

            return {
                academicYear: yearData.academicYear,
                gradeLevel: yearData.gradeLevel,
                courses: coursesList,
                overallYearAverage
            };
        });

        return res.status(200).json({
            success: true,
            data: {
                student: {
                    _id: student._id,
                    fullName: student.fullName,
                    studentID: student.studentID,
                    enrolledYear: student.createdAt || student.enrolledYear
                },
                academicYears: academicYearsFormatted
            }
        });

    } catch (error) {
        console.error("Error generating transcript:", error);
        return res.status(500).json({ 
            success: false, 
            message: "Server error while generating transcript" 
        });
    }
};