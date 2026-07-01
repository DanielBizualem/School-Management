
import { StudentProfile } from "../models/StudentProfile.js";


// FEATURE: Students Portal - View grades & profile information
export const getStudentDashboard = async (userId) => {
    // Look up the profile by matching the 'user' field with the authenticated user ID
    const studentProfile = await StudentProfile.findOne({ user: userId })
        .populate("enrolledCourses", "courseName courseCode") // Brings in full course descriptions
        .populate("grades.course", "courseName courseCode");  // Attaches course context to the marks array

    if (!studentProfile) {
        throw new Error("STUDENT_PROFILE_NOT_FOUND");
    }

    return studentProfile;
};

// FEATURE: Students Portal - Submit complaint for a clicked course
export const createNewComplaint = async (userId, { courseId, subject, description }) => {
    const student = await StudentProfile.findOne({ user: userId });
    if (!student) throw new Error("STUDENT_NOT_FOUND");

    // Pushes the new pending complaint into the array
    student.complaints.push({ 
        course: courseId, 
        subject, 
        description, 
        status: "Pending" 
    });
    
    await student.save();
    return student.complaints;
};