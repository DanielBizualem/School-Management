import { submitStudentMark, getAIStudentEvaluation, registerTeacher} from "../services/teacherService.js";
import * as teacherService from "../services/teacherService.js";
import { StaffProfile } from "../models/staffProfile.js";
import {CourseGradeConfig} from '../models/CourseGradeConfig.js'
import {AcademicYearConfig} from '../models/AcademicYearConfig.js'
import {ClassSection} from '../models/classSection.js'

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
        const { courseId, sectionId, semester } = req.query;

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
                    bottomStudents: [],
                    assessmentAverages: []
                }
            });
        }

        const totalMaxScore = config.assessments.reduce((sum, assessment) => sum + assessment.maxScore, 0);

        // 1. Calculate Average Score per Assessment across all students
        const assessmentStats = config.assessments.map(assessment => {
            let totalEarnedForAssessment = 0;
            let studentCountWithScore = 0;

            config.studentScores.forEach(entry => {
                const scoreRecord = entry.scores.find(s => s.assessmentTitle === assessment.title);
                if (scoreRecord) {
                    totalEarnedForAssessment += scoreRecord.score;
                    studentCountWithScore++;
                }
            });

            const averageScore = studentCountWithScore > 0 
                ? Number((totalEarnedForAssessment / studentCountWithScore).toFixed(1)) 
                : 0;

            return {
                title: assessment.title,
                maxScore: assessment.maxScore,
                averageScore,
                // Calculate percentage out of 100 for easy comparison across different max scores
                averagePercentage: assessment.maxScore > 0 ? Number(((averageScore / assessment.maxScore) * 100).toFixed(1)) : 0
            };
        });

        // 2. Process student total scores (existing logic)
        const processedStudents = config.studentScores.map(entry => {
            const earnedSum = entry.scores.reduce((sum, item) => sum + item.score, 0);
            const percentage = Number(((earnedSum / totalMaxScore) * 100).toFixed(2));
            const isPassing = percentage >= 50;

            return {
                student: entry.student,
                totalEarned: earnedSum,
                totalMax: totalMaxScore,
                scoreOutOf100: percentage,
                isPassing
            };
        });

        processedStudents.sort((a, b) => b.scoreOutOf100 - a.scoreOutOf100);

        const totalStudents = processedStudents.length;
        const passedCount = processedStudents.filter(s => s.isPassing).length;
        const failedCount = totalStudents - passedCount;
        const highestScore = totalStudents > 0 ? processedStudents[0].scoreOutOf100 : 0;
        const lowestScore = totalStudents > 0 ? processedStudents[processedStudents.length - 1].scoreOutOf100 : 0;

        return res.status(200).json({
            success: true,
            data: {
                totalStudents,
                passedCount,
                failedCount,
                highestScore,
                lowestScore,
                topStudents: processedStudents.slice(0, 3),
                bottomStudents: [...processedStudents].reverse().slice(0, 3),
                assessmentAverages: assessmentStats // <--- Added here
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

export const getStudentScoreSheetTable = async (req, res) => {
    try {
        const { courseId, sectionId, semester } = req.query;

        const config = await CourseGradeConfig.findOne({
            course: courseId,
            section: sectionId,
            semester: semester || "semester1"
        }).populate({
            path: 'studentScores.student',
            select: 'fullName studentID'
        });

        if (!config) {
            return res.status(200).json({
                success: true,
                data: {
                    totalStudents: 0,
                    assessmentsList: [],
                    studentTableData: []
                }
            });
        }

        const totalMaxScore = config.assessments.reduce((sum, assessment) => sum + assessment.maxScore, 0);

        // Map student scores into table-friendly rows
        const studentTableData = config.studentScores.map(entry => {
            const earnedSum = entry.scores.reduce((sum, item) => sum + item.score, 0);
            const percentage = totalMaxScore > 0 ? Number(((earnedSum / totalMaxScore) * 100).toFixed(2)) : 0;
            const isPassing = percentage >= 50;

            const scoresMap = {};
            entry.scores.forEach(s => {
                scoresMap[s.assessmentTitle] = s.score;
            });

            return {
                student: entry.student,
                scores: scoresMap,
                totalEarned: earnedSum,
                totalMax: totalMaxScore,
                scoreOutOf100: percentage,
                isPassing
            };
        });

        return res.status(200).json({
            success: true,
            data: {
                totalStudents: studentTableData.length,
                assessmentsList: config.assessments,
                studentTableData
            }
        });

    } catch (error) {
        console.error("Error fetching student score sheet table:", error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

export const getAcademicYearConfigs = async(req, res) => {
    try {
        const configs = await AcademicYearConfig.find().sort({ createdAt: -1 });
        return res.status(200).json({
            success: true,
            data: configs
        });
    } catch (error) {
        console.error("Error fetching academic year configs:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
}

export const sectionRosterController = async (req, res) => {
    try {
        const { academicYear, targetGrade, sectionId, semester } = req.query;

        // 1. Fetch the section and populate students and course references
        const section = await ClassSection.findById(sectionId)
            .populate('students', '_id fullName studentID')
            .populate('courses.course', '_id courseName');

        if (!section) {
            return res.status(404).json({ success: false, message: "Section not found" });
        }

        // 2. Extract courses list for this section & academic year
        const activeCourses = section.courses.filter(c => !academicYear || c.academicYear === academicYear);
        const coursesList = activeCourses.map(c => ({
            _id: c.course._id,
            courseName: c.course.courseName || c.course.name
        }));

        // 3. Fetch all grade configs for these courses in this section and semester
        const courseIds = coursesList.map(c => c._id);
        const gradeConfigs = await CourseGradeConfig.find({
            section: sectionId,
            semester: semester,
            course: { $in: courseIds }
        });

        // Map courseId -> studentId -> total score out of 100
        const courseScoresMap = {};

        gradeConfigs.forEach(config => {
            const courseIdString = config.course.toString();
            courseScoresMap[courseIdString] = {};

            // Calculate max possible score for this course's assessments
            const totalMaxScore = config.assessments.reduce((sum, assessment) => sum + assessment.maxScore, 0);

            config.studentScores.forEach(studentScoreRecord => {
                const studentIdString = studentScoreRecord.student.toString();
                
                // Sum earned scores across all assessments for this student in this course
                const totalEarned = studentScoreRecord.scores.reduce((sum, s) => sum + s.score, 0);

                // Convert/scale to 100% if totalMaxScore > 0
                let scoreOutOf100 = 0;
                if (totalMaxScore > 0) {
                    scoreOutOf100 = (totalEarned / totalMaxScore) * 100;
                }

                if (!courseScoresMap[courseIdString]) {
                    courseScoresMap[courseIdString] = {};
                }
                courseScoresMap[courseIdString][studentIdString] = scoreOutOf100;
            });
        });

        // 4. Build final roster rows per student
        let rosterRows = section.students.map(student => {
            const studentIdStr = student._id.toString();
            const studentCoursesScores = {};
            let totalScoreSum = 0;
            let coursesCount = 0;

            coursesList.forEach(course => {
                const cIdStr = course._id.toString();
                const score = courseScoresMap[cIdStr]?.[studentIdStr];
                
                if (score !== undefined) {
                    studentCoursesScores[cIdStr] = score;
                    totalScoreSum += score;
                    coursesCount++;
                }
            });

            const averageScore = coursesCount > 0 ? (totalScoreSum / coursesCount) : 0;

            return {
                student: {
                    _id: student._id,
                    fullName: student.fullName,
                    studentID: student.studentID
                },
                courses: studentCoursesScores,
                totalScore: totalScoreSum,
                averageScore: averageScore
            };
        });

        // 5. Compute ranks based on performance (averageScore descending)
        // Create a sorted clone to look up each student's rank correctly
        const rankedCopy = [...rosterRows].sort((a, b) => b.averageScore - a.averageScore);
        
        rosterRows = rosterRows.map(row => {
            const rank = rankedCopy.findIndex(r => r.student._id.toString() === row.student._id.toString()) + 1;
            return {
                ...row,
                rank // Rank is computed and placed in the object
            };
        });

        // 6. Sort final rows alphabetically by student full name (spelling order)
        rosterRows.sort((a, b) => a.student.fullName.localeCompare(b.student.fullName));

        return res.status(200).json({
            success: true,
            data: {
                academicYear,
                targetGrade,
                sectionName: section.sectionName,
                coursesList,
                rosterRows,
                totalStudents: section.students.length
            }
        });

    } catch (error) {
        console.error("Error generating section roster:", error);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
};