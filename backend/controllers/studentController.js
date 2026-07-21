import { getStudentDashboard, createNewComplaint } from "../services/studentService.js";
import { StudentProfile } from "../models/StudentProfile.js";
import {Course} from '../models/Course.js'

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
