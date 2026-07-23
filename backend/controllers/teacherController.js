import { submitStudentMark, getAIStudentEvaluation, registerTeacher} from "../services/teacherService.js";
import * as teacherService from "../services/teacherService.js";
import { StaffProfile } from "../models/staffProfile.js";
import {CourseGradeConfig} from '../models/CourseGradeConfig.js'

export const updateStudentGrade = async (req, res) => {
    const { studentId, courseId, sectionId, semester, assessments } = req.body;
    
    // req.user.id is automatically populated by your protect authentication middleware
    const teacherUserId = req.user.id; 

    try {
        // 1. Structural Request Validation
        if (!studentId || !courseId || !sectionId || !assessments || !Array.isArray(assessments)) {
            return res.status(400).json({ 
                success: false,
                message: "Missing required parameters. studentId, courseId, sectionId, and assessments array are all required." 
            });
        }

        // 2. Execute Service Operation (passing full payload to CourseGradeConfig)
        const updatedConfig = await submitStudentMark(teacherUserId, { 
            studentId, 
            courseId, 
            sectionId,
            semester: semester || "semester1",
            assessments 
        });

        // 3. Return Success Payload
        return res.status(200).json({
            success: true,
            message: "Student grades successfully updated.",
            data: updatedConfig
        });

    } catch (error) {
        // 4. Catch Security and Structural Exceptions Cleanly
        if (error.message === "UNAUTHORIZED_COURSE_ACCESS") {
            return res.status(403).json({
                success: false,
                message: "Access Denied: You are not authorized to submit grades for this course curriculum."
            });
        }

        if (error.message === "STUDENT_NOT_FOUND") {
            return res.status(404).json({
                success: false,
                message: "Operation Failed: No student record matches the provided studentId."
            });
        }

        if (error.message === "COURSE_GRADE_CONFIG_NOT_FOUND") {
            return res.status(404).json({
                success: false,
                message: "Operation Failed: No grading configuration found for this course and section."
            });
        }

        // Global fallback error
        return res.status(500).json({
            success: false,
            message: "Internal server error occurred while processing grade.",
            error: error.message
        });
    }
};


export const generateEvaluationText = async (req, res) => {
    const { studentId, courseId } = req.body;

    try {
        if (!studentId || !courseId) {
            return res.status(400).json({ message: "Student ID and Course ID are required." });
        }

        const evaluationReport = await getAIStudentEvaluation(studentId, courseId);
        
        return res.status(200).json({
            success: true,
            data: evaluationReport
        });
    } catch (error) {
        return res.status(500).json({ 
            success: false, 
            message: "Could not compile AI evaluation.", 
            error: error.message 
        });
    }
};

export const register = async (req, res) => {
    try {
        const { 
            personalInfo, contactAddress, education, 
            experience, emergencyContact, salary 
        } = req.body;

        // Validation: Ensure required nested objects exist
        if (!personalInfo || !contactAddress || !salary || !emergencyContact) {
            return res.status(400).json({ success: false, message: "Missing required profile fields." });
        }

        const data = await registerTeacher({ 
            personalInfo, contactAddress, education, 
            experience, emergencyContact, salary 
        });

        return res.status(201).json({
            success: true,
            message: "Teacher registered successfully",
            teacher: data.teacher,
            credentials: data.credentials 
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

export const getTeachers = async (req, res) => {
    try {
        const teachers = await teacherService.getAllTeachers();
        res.status(200).json({
            success: true,
            count: teachers.length,
            data: teachers
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};


export const updateTeacher = async (req, res) => {
    try {
        //console.log("Current User:",req.user)
        const { id } = req.params;
        const { teacherId, status } = req.body;
        console.log("DEBUG: Looking for ID:", teacherId);
        
        const updatedTeacher = await StaffProfile.findByIdAndUpdate(
            teacherId, 
            { status }, 
            { new: true }
        );
        
        res.json({ success: true, data: updatedTeacher });
    } catch (error) {
        console.error("DEBUG ERROR:", error); // This will show the actual message in your terminal
        res.status(500).json({ 
        message: "Update failed", 
        error: error.message || error // Send the message specifically
    });
    }
}

export const getTeacherDetails = async (req, res) => {
    try {
        const userId = req.user.id; 

        // Query the StaffProfile/TeacherProfile model and populate assigned courses and sections
        const profile = await StaffProfile.findOne({ user: userId })
            .populate('user')
            .populate('assignedCourses')    // Populates course documents (e.g. courseName, code)
            .populate('assignedSections');  // Populates class section documents (e.g. sectionName, gradeLevel)

        if (!profile) {
            return res.status(404).json({ success: false, message: "Profile not found for this user." });
        }

        res.json({ success: true, data: profile });
    } catch (error) {
        res.status(500).json({ message: "Error fetching details", error: error.message });
    }
};

export const saveSectionMaxScores = async (req, res) => {
    try {
        const { courseId, sectionId, semester, assessments } = req.body;

        let gradeConfig = await CourseGradeConfig.findOne({ course: courseId, section: sectionId, semester });

        if (gradeConfig) {
            gradeConfig.assessments = assessments; // Updates max scores / titles
            await gradeConfig.save();
        } else {
            gradeConfig = await CourseGradeConfig.create({
                course: courseId,
                section: sectionId,
                semester,
                assessments,
                studentScores: []
            });
        }

        return res.status(200).json({ success: true, message: "Max scores saved successfully", data: gradeConfig });
    } catch (error) {
        return res.status(500).json({ success: false, message: "Server error", error: error.message });
    }
};

export const updateStudentGrades = async (req, res) => {
    try {
        const { studentId, courseId, sectionId, semester, assessments } = req.body;

        let gradeConfig = await CourseGradeConfig.findOne({ course: courseId, section: sectionId, semester });
        if (!gradeConfig) {
            return res.status(404).json({ success: false, message: "Please save section max scores first." });
        }

        // Format incoming scores array
        const formattedScores = assessments.map(a => ({
            assessmentTitle: a.title,
            score: a.score
        }));

        // Find if student entry already exists
        const studentIndex = gradeConfig.studentScores.findIndex(s => s.student.toString() === studentId);

        if (studentIndex > -1) {
            gradeConfig.studentScores[studentIndex].scores = formattedScores;
        } else {
            gradeConfig.studentScores.push({
                student: studentId,
                scores: formattedScores
            });
        }

        await gradeConfig.save();
        return res.status(200).json({ success: true, message: "Student grades successfully updated!" });
    } catch (error) {
        return res.status(500).json({ success: false, message: "Server error", error: error.message });
    }
};

export const getStudentScoresForTeacher = async (req, res) => {
    try {
        const { courseId, sectionId, studentId } = req.params;
        const { semester } = req.query;

        // 1. Find the course grade configuration for this course & section
        const query = { course: courseId, section: sectionId };
        if (semester) query.semester = semester;

        const gradeConfig = await CourseGradeConfig.findOne(query).populate('course', 'courseName courseCode');

        if (!gradeConfig) {
            return res.status(200).json({ 
                success: true, 
                data: { assessments: [] },
                message: "No assessment configuration found for this course yet." 
            });
        }

        // 2. Extract this specific student's scores from the studentScores array
        const studentScoreEntry = gradeConfig.studentScores?.find(
            (s) => String(s.student) === String(studentId) || String(s.student?._id) === String(studentId)
        );

        // 3. Map maxScores with individual student scores
        const combinedAssessments = gradeConfig.assessments.map(assessment => {
            const matchedScoreObj = studentScoreEntry?.scores?.find(
                scoreItem => scoreItem.assessmentTitle === assessment.title
            );
            return {
                _id: assessment._id,
                title: assessment.title,
                maxScore: assessment.maxScore,
                score: matchedScoreObj ? matchedScoreObj.score : 0
            };
        });

        return res.status(200).json({
            success: true,
            data: {
                semester: gradeConfig.semester,
                assessments: combinedAssessments
            }
        });

    } catch (error) {
        console.error("Error fetching student scores for teacher:", error);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
};

export const getStudentAnalytics = async (req, res) => {
    try {
        const { courseId, sectionId, semester } = req.query; // Or req.params depending on your router design

        // 1. Find the specific CourseGradeConfig document
        const config = await CourseGradeConfig.findOne({
            course: courseId,
            section: sectionId,
            semester: semester || "semester1"
        }).populate({
            path: 'studentScores.student',
            select: 'fullName studentID'
        });

        if (!config || !config.assessments || config.assessments.length === 0) {
            return res.status(200).json({
                success: true,
                data: {
                    totalStudents: 0,
                    passedCount: 0,
                    failedCount: 0,
                    highestScore: 0,
                    lowestScore: 0,
                    topStudents: [],
                    bottomStudents: []
                }
            });
        }

        // 2. Calculate total possible max score from all assessments
        const totalMaxScore = config.assessments.reduce((sum, assessment) => sum + assessment.maxScore, 0);

        if (totalMaxScore === 0) {
            return res.status(400).json({ success: false, message: "Total max score cannot be zero." });
        }

        // 3. Process each student's total score out of 100
        const processedStudents = config.studentScores.map(entry => {
            const earnedSum = entry.scores.reduce((sum, item) => sum + item.score, 0);
            
            // Normalize to a percentage out of 100
            const percentage = Number(((earnedSum / totalMaxScore) * 100).toFixed(2));
            const passingScoreThreshold = 50; // You can adjust passing threshold criteria (e.g., 50%)
            const isPassing = percentage >= passingScoreThreshold;

            return {
                student: entry.student, // Populated student object (fullName, studentID, _id)
                totalEarned: earnedSum,
                totalMax: totalMaxScore,
                scoreOutOf100: percentage,
                isPassing
            };
        });

        // 4. Sort students by score descending (highest to lowest)
        processedStudents.sort((a, b) => b.scoreOutOf100 - a.scoreOutOf100);

        // 5. Compute metrics
        const totalStudents = processedStudents.length;
        const passedCount = processedStudents.filter(s => s.isPassing).length;
        const failedCount = totalStudents - passedCount;

        const highestScore = totalStudents > 0 ? processedStudents[0].scoreOutOf100 : 0;
        const lowestScore = totalStudents > 0 ? processedStudents[processedStudents.length - 1].scoreOutOf100 : 0;

        // Best 3 students (Top 3)
        const topStudents = processedStudents.slice(0, 3);

        // Last 3 students who fell behind (Bottom 3, reversed so lowest is first or ordered appropriately)
        const bottomStudents = [...processedStudents].reverse().slice(0, 3);

        return res.status(200).json({
            success: true,
            data: {
                totalStudents,
                passedCount,
                failedCount,
                highestScore,
                lowestScore,
                topStudents,
                bottomStudents
            }
        });

    } catch (error) {
        console.error("Error generating student analytics:", error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

export const getTeacherCoursesAndSections = async (req, res) => {
    try {
        // Assuming your auth middleware adds the teacher's ID to req.userId or req.user._id
        const teacherId = req.userId || req.user?._id;

        // Find all configurations where this teacher has grade sheets
        // (Or if your CourseGradeConfig doesn't store teacher directly, you can match via ClassSection)
        const configs = await CourseGradeConfig.find({})
            .populate('course', 'courseName name')
            .populate('section', 'sectionName');

        // Extract unique courses and sections
        const courseMap = new Map();
        const sectionMap = new Map();

        configs.forEach(config => {
            if (config.course) {
                courseMap.set(config.course._id.toString(), {
                    _id: config.course._id,
                    courseName: config.course.courseName || config.course.name
                });
            }
            if (config.section) {
                sectionMap.set(config.section._id.toString(), {
                    _id: config.section._id,
                    sectionName: config.section.sectionName
                });
            }
        });

        return res.status(200).json({
            success: true,
            courses: Array.from(courseMap.values()),
            sections: Array.from(sectionMap.values())
        });
    } catch (error) {
        console.error("Error fetching courses and sections for filters:", error);
        return res.status(500).json({ success: false, message: error.message });
    }
};