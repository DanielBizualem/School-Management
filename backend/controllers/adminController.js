import { createTeacherAccount, createDirectorAccount, createNewCourse } from "../services/adminService.js";
import { createStudentAccount } from "../services/adminService.js";
import { User } from "../models/User.js";
import { Admin } from "../models/adminProfile.js";
import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import { Course } from "../models/Course.js";
import { StudentProfile } from "../models/studentProfile.js";
import { sendTemporaryPasswordEmail } from "../utils/sendEmail.js";
import crypto from 'crypto';

export const registerStudent = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const tempPassword = crypto.randomBytes(4).toString("hex");

        const { newProfile, customStudentID } = await createStudentAccount(
            req.body, 
            { session, tempPassword }
        );

        await session.commitTransaction();

        // REMOVED: The call to sendTemporaryPasswordEmail(...)

        // UPDATED: Include tempPassword in the response data
        res.status(201).json({ 
            message: "Student registered successfully!", 
            data: { 
                ...newProfile.toObject(), 
                customStudentID,
                tempPassword // Now it will be available in res.data.data
            } 
        });
    } catch (err) {
        await session.abortTransaction();
        res.status(400).json({ message: err.message });
    } finally {
        session.endSession();
    }
};

export const registerTeacher = async (req, res) => {
    try {
        const data = await createTeacherAccount(req.body);
        res.status(201).json({ message: "Teacher registered!", data });
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

export const registerDirector = async (req, res) => {
    try {
        const data = await createDirectorAccount(req.body);
        res.status(201).json({ message: "Director registered!", data });
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

export const addCourse = async (req, res) => {
    try {
        // req.body expects: { "courseName": "...", "courseCode": "...", "teacherId": "..." }
        const course = await createNewCourse(req.body);
        
        res.status(201).json({ 
            message: "Course created successfully and assigned to the teacher.", 
            course 
        });
    } catch (err) {
        if (err.message === "COURSE_CODE_EXISTS") {
            return res.status(400).json({ message: "This course code already exists." });
        }
        if (err.message === "TEACHER_NOT_FOUND") {
            return res.status(404).json({ message: "The specified teacher profile was not found." });
        }
        
        res.status(500).json({ message: "Server error configuring course", error: err.message });
    }
};

export const getAllCourses = async (req, res) => {
    try {
        // Fetch all courses
        const courses = await Course.find({});

        res.status(200).json({
            success: true,
            count: courses.length,
            data: courses
        });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            message: "Error fetching courses", 
            error: error.message 
        });
    }
}

export const createAdmin = async (req, res) => {
    const { email, password, fullName, adminID, department, phoneNumber, permissions } = req.body;

    // Start a Mongoose session for the transaction
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        // 1. Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: "Email already registered" });
        }

        // 2. Hash the password
        const hashedPassword = await bcrypt.hash(password, 12);

        // 3. Create the User (Auth record)
        const newUser = await User.create([{
            email,
            password: hashedPassword,
            role: "admin"
        }], { session });

        // 4. Create the Admin Profile record
        await Admin.create([{
            user: newUser[0]._id,
            fullName,
            adminID,
            department,
            phoneNumber,
            permissions: permissions || ["view_reports"] // Default permission
        }], { session });

        // Commit the transaction
        await session.commitTransaction();
        
        res.status(201).json({ message: "Admin created successfully" });

    } catch (error) {
        // If anything fails, undo all changes
        await session.abortTransaction();
        res.status(500).json({ message: "Error creating admin", error: error.message });
    } finally {
        session.endSession();
    }
};

export const getAllStudents = async (req, res) => {
    try {
        // Fetch all students and populate the user details
        const students = await StudentProfile.find({})
            .populate('user', 'email role') // Pulls specific fields from the User collection
            .populate('familyProfile');      // Pulls details from the ParentProfile

        res.status(200).json({
            success: true,
            count: students.length,
            data: students
        });
    } catch (error) {
        res.status(500).json({ success: false, message: "Error fetching students", error: error.message });
    }
};