import { User } from "../models/User.js";
import { StudentProfile } from "../models/StudentProfile.js";
import { ParentProfile } from "../models/ParentProfile.js";
import { Counter } from "../models/Counter.js";
import bcrypt from "bcrypt";
import crypto from "crypto";

// FEATURE: System Admin - Registering new Students
export const createStudentAccount = async (studentData) => {
    const { 
        email, fullName, gradeLevel, gender, 
        parentName, parentPhone, parentJob, parentAddress, parentRelation 
    } = studentData;

    // 1. Core Validation Check
    const emailExists = await User.findOne({ email });
    if (emailExists) throw new Error("EMAIL_EXISTS");

    // 2. Atomic Auto-Increment Engine
    // Finds the student tracker document and adds 1 to 'seq'. Creates it if it doesn't exist.
    const counter = await Counter.findOneAndUpdate(
        { id: "studentIdSequence" },
        { $inc: { seq: 1 } },
        { new: true, upsert: true }
    );

    // Get the current 2-digit year (e.g., 2026 -> "26")
    const registeredYear = new Date().getFullYear().toString().slice(-2);
    
    // Formats the sequence into a 5-digit padded string (e.g., 1 -> "00001")
    const paddedSequence = counter.seq.toString().padStart(5, "0");
    const customStudentID = `std/${paddedSequence}/${registeredYear}`;

    // 3. Step One: Save the Family Profile Document
    const newParent = await ParentProfile.create({
        fullName: parentName,
        phoneNumber: parentPhone,
        jobType: parentJob,
        address: parentAddress,
        relation: parentRelation
    });

    // 4. Generate Student Password & User Credentials
    const tempPassword = crypto.randomBytes(4).toString("hex"); 
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(tempPassword, salt);

    const newAccount = await User.create({
        email,
        password: hashedPassword,
        role: "student",
        isFirstLogin: true
    });

    // 5. Step Two: Instantiate Student Profile with Auto-Generated ID
    const newProfile = await StudentProfile.create({
        user: newAccount._id,
        fullName,
        studentID: customStudentID, // Securely assigned automatically by the server
        gradeLevel,
        gender,
        familyProfile: newParent._id,
        enrolledCourses: [], 
        grades: []
    });

    return {
        studentId: newProfile._id,
        generatedStudentID: customStudentID,
        temporaryPassword: tempPassword
    };
};

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