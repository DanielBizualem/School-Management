import { getStudentDashboard, createNewComplaint } from "../services/studentService.js";
import { StudentProfile } from "../models/StudentProfile.js";
import {Course} from '../models/Course.js'
import {ClassSection} from '../models/classSection.js'
import {StaffProfile} from '../models/staffProfile.js'
import {CourseGradeConfig} from '../models/CourseGradeConfig.js'
import mongoose from "mongoose";

export const viewMyDashboard = async (req, res) => {
    // Securely pull the user ID from the validated JWT token payload
    const studentUserId = req.user.id;

    try {
        const profileData = await getStudentDashboard(studentUserId);

        return res.status(200).json({
            success: true,
            message: "Student data fetched successfully.",
            data: {
                fullName: profileData.fullName,
                studentID: profileData.studentID,
                gradeLevel: profileData.gradeLevel,
                enrolledCourses: profileData.enrolledCourses,
                grades: profileData.grades,       // Contains only their personal marks
                complaints: profileData.complaints
            }
        });

    } catch (error) {
        if (error.message === "STUDENT_PROFILE_NOT_FOUND") {
            return res.status(404).json({
                success: false,
                message: "Profile error: No student profile registration linked to this account token."
            });
        }

        return res.status(500).json({
            success: false,
            message: "Internal server error occurred while loading dashboard.",
            error: error.message
        });
    }
};

export const fileComplaint = async (req, res) => {
    try {
        const activeComplaints = await createNewComplaint(req.user.id, req.body);
        res.status(201).json({ message: "Complaint logged as Pending", activeComplaints });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};

export const getStudentTranscript = async (req, res) => {
    try {
        const userId = req.user.id;

        // 1. Find the student profile and populate existing grades
        const profile = await StudentProfile.findOne({ user: userId })
            .populate({
                path: 'grades.course',
                select: 'courseName courseCode'
            });

        if (!profile) {
            return res.status(404).json({ 
                success: false, 
                message: "Profile not found" 
            });
        }

        // 2. Flexible Course Query (Handles both field name variations and formats)
        // profile.gradeLevel might be "9th Grade" or "9"
        const studentGrade = profile.gradeLevel;
        // Create an alternative version just in case (e.g. extracts number or adds text)
        const numericGrade = studentGrade.replace(/\D/g, ""); // e.g. "9th Grade" -> "9"

        const availableCourses = await Course.find({
            $or: [
                { gradeLevels: { $in: [studentGrade, numericGrade] } },
                { gradeLevel: { $in: [studentGrade, numericGrade] } }
            ]
        });

        // 3. Return the data
        return res.status(200).json({ 
            success: true, 
            data: {
                studentProfile: profile,
                enrolledLevelCourses: availableCourses
            } 
        });

    } catch (error) {
        console.error("Error fetching student transcript:", error);
        return res.status(500).json({ 
            success: false, 
            message: error.message 
        });
    }
};

{/** recent implementation */}

export const getTeacherCourses = async (req, res) => {
    try {
         //req.userId = req.user.id
        // Assuming req.userId is available from your authentication middleware
        const teacherProfile = await StaffProfile.findOne({ user: req.user.id })
            .populate('assignedCourses');

        if (!teacherProfile) {
            return res.status(404).json({ success: false, message: "Teacher profile not found" });
        }

        return res.status(200).json({
            success: true,
            data: teacherProfile.assignedCourses // Returns array of populated Course documents
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

export const getStudentsByCourse = async (req, res) => {
    try {
        const { courseId } = req.params;

        // Find all class sections tied to this course
        const sections = await ClassSection.find({ course: courseId });
        const sectionIds = sections.map(sec => sec._id);

        // Find students whose enrolledSections contain any of these section IDs
        const students = await StudentProfile.find({
            enrolledSections: { $in: sectionIds }
        }).select("fullName studentID gradeLevel gender");

        return res.status(200).json({
            success: true,
            data: students
        });
    } catch (error) {
        console.error("Error fetching students by course:", error);
        return res.status(500).json({ success: false, message: error.message });
    }
};
export const updateStudentGrades = async (req, res) => {
    try {
        const { studentId, courseId, semester, assessments } = req.body;

        if (!studentId || !courseId || !semester || !Array.isArray(assessments)) {
            return res.status(400).json({ success: false, message: "Missing required grading parameters." });
        }

        const student = await StudentProfile.findById(studentId);
        if (!student) {
            return res.status(404).json({ success: false, message: "Student profile not found." });
        }

        // Find the target course entry in the student's grades array
        const gradeIndex = student.grades.findIndex(
            g => g.course.toString() === courseId
        );

        if (gradeIndex === -1) {
            return res.status(404).json({ success: false, message: "Course mapping not found on student profile." });
        }

        // Calculate total points earned from the teacher's custom max score matrix
        const totalEarnedPoints = assessments.reduce((sum, item) => sum + Number(item.score || 0), 0);

        // Update the assessments breakdown and assign the computed score to the appropriate semester
        student.grades[gradeIndex].assessments = assessments;
        if (semester === "semester1") {
            student.grades[gradeIndex].semester1Mark = totalEarnedPoints;
        } else if (semester === "semester2") {
            student.grades[gradeIndex].semester2Mark = totalEarnedPoints;
        }

        await student.save();

        return res.status(200).json({
            success: true,
            message: "Student grades successfully updated.",
            data: student.grades[gradeIndex]
        });
    } catch (error) {
        console.error("Error updating student grades:", error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

export const getStudentDashboardGrades = async (req, res) => {
    try {
        const studentProfileId = req.user.studentProfileId; // Derived from student token session
        const studentSectionId = req.user.sectionId; // Derived from student's active section

        // Find all grade configurations matching the student's section
        const configs = await CourseGradeConfig.find({ section: studentSectionId }).populate('course', 'courseName');

        const processedGrades = configs.map(config => {
            // Find specific student entry if graded
            const studentRecord = config.studentScores.find(s => s.student.toString() === studentProfileId);

            return {
                courseName: config.course?.courseName,
                semester: config.semester,
                assessments: config.assessments.map(ass => {
                    const matchedScore = studentRecord?.scores.find(s => s.assessmentTitle === ass.title);
                    return {
                        title: ass.title,
                        maxScore: ass.maxScore,
                        score: matchedScore ? matchedScore.score : null // Null if teacher hasn't entered student's mark yet
                    };
                })
            };
        });

        return res.status(200).json({ success: true, data: processedGrades });
    } catch (error) {
        return res.status(500).json({ success: false, message: "Server error", error: error.message });
    }
};

export const getStudentCoursePerformance = async (req, res) => {
    try {
        const userId = req.user.id;
        const { courseId } = req.params;
        const { semester } = req.query;

        // 1. Find the student profile
        const studentProfile = await StudentProfile.findOne({ user: userId });
        if (!studentProfile) {
            return res.status(404).json({ success: false, message: "Student profile not found" });
        }

        const studentId = studentProfile._id;
        
        // 2. Find the ClassSection where this student's ID is included in the `students` array
        const ClassSection = mongoose.model('ClassSection');
        const studentSection = await ClassSection.findOne({ students: studentId });

        if (!studentSection) {
            return res.status(200).json({ 
                success: true, 
                data: {
                    course: null,
                    semester: semester || "semester1",
                    teacherName: "TBA",
                    assessments: []
                },
                message: "Student is not assigned to any class section yet." 
            });
        }

        const studentSectionId = studentSection._id;

        // 3. Find the course grade configuration for this course & section
        const query = { course: courseId, section: studentSectionId };
        if (semester) query.semester = semester;

        const gradeConfig = await CourseGradeConfig.findOne(query).populate('course', 'courseName courseCode');

        // Return 200 with empty assessments so the UI loads cleanly without 404 errors
        if (!gradeConfig) {
            return res.status(200).json({ 
                success: true, 
                data: {
                    course: null,
                    semester: semester || "semester1",
                    teacherName: "TBA",
                    assessments: []
                },
                message: "No assessment configuration found for this course yet." 
            });
        }

        // 4. Find the teacher ID linked to this specific course inside the ClassSection's courses array
        const courseEntry = studentSection.courses?.find(
            (c) => String(c.course) === String(courseId) || String(c.course?._id) === String(courseId)
        );

        let teacherFullName = "TBA";

        if (courseEntry && courseEntry.teacher) {
            const staffProfile = await StaffProfile.findById(courseEntry.teacher).populate({
                path: 'user',
                select: 'fullName name'
            });

            teacherFullName = 
                staffProfile?.personalInfo?.fullName || 
                staffProfile?.personalInfo?.name || 
                staffProfile?.user?.fullName || 
                staffProfile?.user?.name || 
                staffProfile?.fullName || 
                staffProfile?.name || 
                "TBA";
        }
        // 5. Extract this specific student's scores from the studentScores array
        const studentScoreEntry = gradeConfig.studentScores.find(
            (s) => String(s.student) === String(studentId)
        );

        // Map maxScores with individual student scores
        const combinedAssessments = gradeConfig.assessments.map(assessment => {
            const matchedScoreObj = studentScoreEntry?.scores?.find(
                scoreItem => scoreItem.assessmentTitle === assessment.title
            );
            return {
                _id: assessment._id,
                title: assessment.title,
                maxScore: assessment.maxScore,
                score: matchedScoreObj ? matchedScoreObj.score : undefined
            };
        });

        return res.status(200).json({
            success: true,
            data: {
                course: gradeConfig.course,
                semester: gradeConfig.semester,
                teacherName: teacherFullName,
                assessments: combinedAssessments
            }
        });

    } catch (error) {
        console.error("Error fetching student course performance:", error);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
};
export const getMaxScore = async (req, res) => {
    try {
        const { courseId, sectionId, semester } = req.params;

        if (!courseId || !sectionId || !semester) {
            return res.status(400).json({
                success: false,
                message: "Please provide courseId, sectionId, and semester parameters."
            });
        }

        // Find the document matching the course, section, and semester using CourseGradeConfig
        const maxScoreConfig = await CourseGradeConfig.findOne({
            course: courseId,
            section: sectionId,
            semester: semester
        });

        if (!maxScoreConfig) {
            return res.status(404).json({
                success: false,
                message: "No assessment configuration found for this course and section."
            });
        }

        return res.status(200).json({
            success: true,
            data: maxScoreConfig // Returns the document containing the assessments array
        });

    } catch (error) {
        console.error("Error fetching max scores:", error);
        return res.status(500).json({
            success: false,
            message: "Server error while fetching max scores.",
            error: error.message
        });
    }
};

