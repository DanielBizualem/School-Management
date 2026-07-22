import { getStudentDashboard, createNewComplaint } from "../services/studentService.js";
import { StudentProfile } from "../models/StudentProfile.js";
import {Course} from '../models/Course.js'
import {ClassSection} from '../models/classSection.js'

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
        const teacherId = req.user.id;

        // Find all sections taught by this teacher and populate their courses
        const sections = await ClassSection.find({ teacher: teacherId }).populate("course");
        
        // Extract unique courses using a Map
        const courseMap = new Map();
        sections.forEach(section => {
            if (section.course) {
                courseMap.set(section.course._id.toString(), section.course);
            }
        });

        return res.status(200).json({
            success: true,
            data: Array.from(courseMap.values())
        });
    } catch (error) {
        console.error("Error fetching teacher courses:", error);
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
