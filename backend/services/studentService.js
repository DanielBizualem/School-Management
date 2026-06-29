import { User } from "../models/User.js";
import { StudentProfile } from "../models/StudentProfile.js";
import bcrypt from "bcrypt";
import crypto from "crypto";

// FEATURE: System Admin - Registering new Students
export const createStudentAccount = async ({ email, fullName, idSequence }) => {
    // 1. Core Validation Rules
    const emailExists = await User.findOne({ email });
    if (emailExists) throw new Error("EMAIL_EXISTS");

    // 2. Dynamic ID Formatting Engine (std/_____/registeredyear)
    // Grabs the last 2 digits of the current year (e.g., 2026 -> "26")
    const registeredYear = new Date().getFullYear().toString().slice(-2);
    const customStudentID = `std/${idSequence}/${registeredYear}`;

    // Ensure this specific customized ID doesn't conflict
    const idExists = await StudentProfile.findOne({ studentID: customStudentID });
    if (idExists) throw new Error("STUDENT_ID_ALREADY_EXISTS");

    // 3. Generate Temporary Security Credentials
    const tempPassword = crypto.randomBytes(4).toString("hex"); 
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(tempPassword, salt);

    // 4. Document Initialization Loops
    const newAccount = await User.create({
        email,
        password: hashedPassword,
        role: "student",
        isFirstLogin: true
    });

    const newProfile = await StudentProfile.create({
        user: newAccount._id,
        fullName,
        studentID: customStudentID, // Saved under the secure pattern
        enrolledCourses: [], 
        grades: [],
        complaints: []
    });

    return {
        studentId: newProfile._id,
        generatedStudentID: customStudentID,
        temporaryPassword: tempPassword
    };
};

// FEATURE: Students Portal - View grades & profile information
export const getStudentDashboard = async (userId) => {
    const profile = await StudentProfile.findOne({ user: userId })
        .populate("enrolledCourses")
        .populate("grades.course", "courseName courseCode");
    
    if (!profile) throw new Error("PROFILE_NOT_FOUND");
    return profile;
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