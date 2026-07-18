import { User } from "../models/User.js";
import { StaffProfile } from "../models/staffProfile.js";
import { Course } from "../models/Course.js";
import bcrypt from "bcrypt";
import crypto from "crypto";
import { ParentProfile } from "../models/ParentProfile.js";
import { Counter } from "../models/Counter.js";
import { Resend } from 'resend'
import {StudentProfile} from "../models/studentProfile.js";
import { Admin } from "../models/adminProfile.js";
import { SchoolSetting } from "../models/SchoolSetting.js";
import {ClassSection} from "../models/classSection.js";


export const createStudentAccount = async (studentData, { session, tempPassword }) => {
    const { 
        email, fullName, gradeLevel, gender, 
        studentPhoto, studentDob, 
        parentName, parentPhone, parentJob, parentAddress, parentRelation, 
        familyPhoto, familyPersonDob
    } = studentData;

    // 1. Validation
    const emailExists = await User.findOne({ email }).session(session);
    if (emailExists) throw new Error("EMAIL_EXISTS");

    // 2. Settings & Section Logic (Must be session-aware)
    const settings = await SchoolSetting.findOne({}).session(session);
    if (!settings || !settings.isRegistrationOpen) throw new Error("REGISTRATION_CLOSED");
    
    const { currentAcademicYear } = settings;

    // FIND OR CREATE SECTIONS
    let sections = await ClassSection.find({ gradeLevel, academicYear: currentAcademicYear }).session(session);
    
    if (sections.length === 0) {
        // IMPORTANT: Ensure your Course collection has gradeLevels that match 'gradeLevel' string
        const allCourses = await Course.find({ gradeLevels: gradeLevel }).session(session);
        
        if (allCourses.length > 0) {
            sections = await ClassSection.create(allCourses.map(course => ({
                course: course._id,
                gradeLevel,
                academicYear: currentAcademicYear,
                teacher: null
            })), { session });
        }
    }

    // 3. ID Generation
    const counter = await Counter.findOneAndUpdate(
        { id: "studentIdSequence" },
        { $inc: { seq: 1 } },
        { new: true, upsert: true, session }
    );
    const registeredYear = new Date().getFullYear().toString().slice(-2);
    const customStudentID = `std/${counter.seq.toString().padStart(5, "0")}/${registeredYear}`;

    // 4. Save Parent, User, and Profile (Using { session })
    const [newParent] = await ParentProfile.create([{
        fullName: parentName, phoneNumber: parentPhone, jobType: parentJob,
        address: parentAddress, relation: parentRelation, familyPhoto, familyPersonDob
    }], { session });

    const hashedPassword = await bcrypt.hash(tempPassword, 10);
    const [newAccount] = await User.create([{
        email, password: hashedPassword, role: "student", isFirstLogin: true
    }], { session });

    const [newProfile] = await StudentProfile.create([{
        user: newAccount._id,
        fullName,
        studentID: customStudentID,
        gradeLevel,
        gender,
        studentPhoto,
        studentDob,
        academicYear: currentAcademicYear,
        enrolledSections: sections.map(s => s._id),
        familyProfile: newParent._id
    }], { session });

    return { newProfile, customStudentID, tempPassword };
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

export const createNewCourse = async ({ courseName, courseCode, gradeLevel }) => {
    console.log("DEBUG: Service received:", { courseName, courseCode, gradeLevel });

    const newCourse = await Course.create({ 
        courseName,
        courseCode,
        gradeLevel
    });

    console.log("DEBUG: Saved Course:", newCourse);

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