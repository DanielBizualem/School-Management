import { User } from "../models/User.js";
import { StaffProfile } from "../models/staffProfile.js";
import { Course } from "../models/Course.js";
import bcrypt from "bcrypt";
import crypto from "crypto";
import { ParentProfile } from "../models/ParentProfile.js";
import { Counter } from "../models/Counter.js";
import { Resend } from 'resend';
import {StudentProfile} from "../models/studentProfile.js";
import { Admin } from "../models/adminProfile.js";


export const createStudentAccount = async (studentData, { session, tempPassword }) => {
    const { 
        email, fullName, gradeLevel, gender, 
        studentPhoto, studentDob, 
        parentName, parentPhone, parentJob, parentAddress, parentRelation, 
        familyPhoto, familyPersonDob 
    } = studentData;

    // 1. Validation Check
    const emailExists = await User.findOne({ email }).session(session);
    if (emailExists) throw new Error("EMAIL_EXISTS");

    // 2. Atomic Auto-Increment Engine
    const counter = await Counter.findOneAndUpdate(
        { id: "studentIdSequence" },
        { $inc: { seq: 1 } },
        { new: true, upsert: true, session }
    );

    const registeredYear = new Date().getFullYear().toString().slice(-2);
    const paddedSequence = counter.seq.toString().padStart(5, "0");
    const customStudentID = `std/${paddedSequence}/${registeredYear}`;

    if (!customStudentID) throw new Error("ID_GENERATION_FAILED");

    // 3. Save Parent Profile
    const [newParent] = await ParentProfile.create([{
        fullName: parentName,
        phoneNumber: parentPhone,
        jobType: parentJob,
        address: parentAddress,
        relation: parentRelation,
        familyPhoto,
        familyPersonDob
    }], { session });

    // 4. Create User
    const hashedPassword = await bcrypt.hash(tempPassword, 10);
    const [newAccount] = await User.create([{
        email,
        password: hashedPassword,
        role: "student",
        isFirstLogin: true
    }], { session });

    // 5. Instantiate Student Profile
    const [newProfile] = await StudentProfile.create([{
        user: newAccount._id,
        fullName,
        studentID: customStudentID,
        gradeLevel,
        gender,
        studentPhoto,
        studentDob,
        familyProfile: newParent._id
    }], { session });

    // Updated return to include tempPassword for the PDF
    return { 
        newProfile, 
        customStudentID, 
        tempPassword // Added this to pass it back to the client
    };
};

export const createTeacherAccount = async ({ email, fullName, phone, department }) => {
    const { account, tempPassword } = await createBaseUser(email, "teacher");
    
    const profile = await TeacherProfile.create({
        user: account._id,
        fullName,
        phone,
        department,
        assignedCourses: [],
        attendanceLog: []
    });

    return { id: profile._id, tempPassword };
};

export const createDirectorAccount = async ({ email }) => {
    const { account, tempPassword } = await createBaseUser(email, "director");
    return { id: account._id, tempPassword };
};

export const createNewCourse = async ({ courseName, courseCode, teacherId }) => {
    // 1. Validation: Ensure the course code is unique
    const codeExists = await Course.findOne({ courseCode });
    if (codeExists) throw new Error("COURSE_CODE_EXISTS");

    // 2. Validation: Ensure the assigned teacher actually exists
    const teacher = await StaffProfile.findById(teacherId);
    if (!teacher) throw new Error("TEACHER_NOT_FOUND");

    // 3. Create the course document and map it to the teacher
    const newCourse = await Course.create({ 
        courseName,
        courseCode,
        teacher: teacherId
    });

    // 4. Update the teacher's profile array to include this new course
    teacher.assignedCourses.push(newCourse._id);
    await teacher.save();

    return newCourse;
};

export const createAdmin = async (adminData) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        // 1. Create the Auth User
        const newUser = await User.create([{ 
            email: adminData.email, 
            password: hashedPassword, 
            role: "admin" 
        }], { session });

        // 2. Create the Admin Profile
        await Admin.create([{
            user: newUser[0]._id,
            fullName: adminData.fullName,
            adminID: adminData.adminID,
            department: adminData.department,
            phoneNumber: adminData.phoneNumber
        }], { session });

        await session.commitTransaction();
    } catch (error) {
        await session.abortTransaction();
        throw error;
    } finally {
        session.endSession();
    }
};

export const getAdminDetail = async (adminId) => {
    // 1. Fetch profile and populate user details
    const adminProfile = await Admin.findById(adminId).populate("user", "email");
    
    // 2. Throw specific error if not found
    if (!adminProfile) throw new Error("ADMIN_NOT_FOUND");

    // 3. Return a clean data object
    // Use optional chaining (?.) in case 'user' reference is somehow missing
    return {
        fullName: adminProfile.fullName,
        adminID: adminProfile.adminID,
        department: adminProfile.department,
        phoneNumber: adminProfile.phoneNumber,
        email: adminProfile.user?.email || "N/A"
    };
};