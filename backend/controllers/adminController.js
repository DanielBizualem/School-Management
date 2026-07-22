import { createTeacherAccount, createDirectorAccount, createNewCourse } from "../services/adminService.js";
import { createStudentAccount } from "../services/adminService.js";
import { User } from "../models/User.js";
import { Admin } from "../models/adminProfile.js";
import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import { Course } from "../models/Course.js";
//import { StudentProfile } from "../models/StudentProfile.js";
import { StudentProfile } from "../models/StudentProfile.js";
import { sendTemporaryPasswordEmail } from "../utils/sendEmail.js";
import crypto from 'crypto';
import { getAdminDetail } from "../services/adminService.js";
import {SchoolSetting} from "../models/SchoolSetting.js";
import { ClassSection } from "../models/classSection.js";
import { StaffProfile } from "../models/staffProfile.js";

export const registerStudent = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const tempPassword = crypto.randomBytes(4).toString("hex");

        const { newProfile, customStudentID, tempPassword: password } = await createStudentAccount(
            req.body, 
            { session, tempPassword }
        );

        await session.commitTransaction();

        res.status(201).json({ 
            message: "Student registered successfully!", 
            data: { 
                ...newProfile.toObject(), 
                customStudentID,
                tempPassword: password 
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
    // 1. Add this log to verify what Postman is sending
    console.log("DEBUG: Incoming Request Body:", req.body);

    const { courseName, courseCode, gradeLevel } = req.body;

    if (!courseName || !courseCode || !gradeLevel || gradeLevel.length === 0) {
        return res.status(400).json({ 
            success: false, 
            message: "Missing data. Please provide courseName, courseCode, and gradeLevel." 
        });
    }

    try {
        const course = await createNewCourse(req.body);
        res.status(201).json({ message: "Success", course });
    } catch (err) {
        console.error("DEBUG: Service Error:", err);
        res.status(500).json({ message: "Server error", error: err.message });
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

export const getAdminDetailController = async (req, res) => {
    try {
        // Assuming adminId comes from an auth middleware or params
        const { adminId } = req.params; 
        
        const adminData = await getAdminDetail(adminId);
        
        return res.status(200).json({
            success: true,
            data: adminData
        });
    } catch (error) {
        if (error.message === "ADMIN_NOT_FOUND") {
            return res.status(404).json({ success: false, message: "Admin profile not found." });
        }
        
        console.error("GET_ADMIN_ERROR:", error);
        return res.status(500).json({ success: false, message: "Internal server error." });
    }
};

export const registerCourse = async (req, res) => {
    try {
        const { courseName, courseCode, gradeLevel } = req.body;

        // 1. Basic Validation
        if (!courseName || !courseCode || !gradeLevel || gradeLevel.length === 0) {
            return res.status(400).json({ 
                success: false, 
                message: "Please provide course name, code, and at least one grade level." 
            });
        }

        // 2. Check if code already exists
        const existingCourse = await Course.findOne({ courseCode });
        if (existingCourse) {
            return res.status(400).json({ 
                success: false, 
                message: "Course with this code already exists." 
            });
        }

        // 3. Create the course
        // We save the 'gradeLevels' so the system knows which students 
        // should be enrolled in this course later.
        const newCourse = await Course.create({
            courseName,
            courseCode,
            gradeLevel
        });

        res.status(201).json({ 
            success: true, 
            message: "Course registered successfully!", 
            data: newCourse 
        });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            message: "Server error", 
            error: error.message 
        });
    }
};

export const initializeSettings = async () => {
    const existing = await SchoolSetting.findOne();
    if (!existing) {
        await SchoolSetting.create({ 
            currentAcademicYear: "2018",
            isRegistrationOpen: true
        });
    }
};

export const updateSettings = async (req, res) => {
    try {
        const { currentAcademicYear, isRegistrationOpen } = req.body;
        
        const settings = await SchoolSetting.findOneAndUpdate(
            {}, 
            { currentAcademicYear, isRegistrationOpen },
            { new: true, upsert: true } // Upsert ensures it creates if it doesn't exist
        );
        
        res.status(200).json(settings);
    } catch (error) {
        res.status(500).json({ error: "Failed to update settings" });
    }
};

export const assignTeacherToSection = async (req, res) => {
    try {
        const { sectionId, courses } = req.body;

        if (!sectionId || !Array.isArray(courses)) {
            return res.status(400).json({ 
                success: false, 
                message: "Section ID and an array of courses are required." 
            });
        }

        // Update ClassSection document
        const updatedSection = await ClassSection.findByIdAndUpdate(
            sectionId,
            { courses },
            { new: true, runValidators: true }
        ).populate('courses.course courses.teacher students');

        if (!updatedSection) {
            return res.status(404).json({ success: false, message: "Class section not found." });
        }

        // Sync assignments to each TeacherProfile document
        const teacherUpdatePromises = courses.map(async (item) => {
            if (item.teacher && item.course) {
                const teacherId = typeof item.teacher === 'object' ? item.teacher._id : item.teacher;
                const courseId = typeof item.course === 'object' ? item.course._id : item.course;

                // Update TeacherProfile using $addToSet to avoid duplicates
                await StaffProfile.findByIdAndUpdate(
                    teacherId,
                    {
                        $addToSet: { 
                            assignedCourses: courseId,
                            assignedSections: sectionId 
                        }
                    }
                );
            }
        });

        await Promise.all(teacherUpdatePromises);

        return res.status(200).json({
            success: true,
            message: "Section course assignments updated successfully and synced to teacher profile.",
            data: updatedSection
        });
    } catch (error) {
        console.error("Error assigning courses:", error);
        return res.status(500).json({ success: false, message: "Internal server error." });
    }
};

// Controller: Get All Class Sections
export const getAllClassSections = async (req, res) => {
    try {
        const sections = await ClassSection.find({})
            .populate({
                path: 'courses.course',
                select: 'courseName courseCode'
            })
            .populate({
                path: 'courses.teacher',
                select: 'fullName personalInfo.fullName personalInfo.department'
            })
            .populate('students'); // <--- This is what populates the students array

        return res.status(200).json({
            success: true,
            data: sections,
            message: "Class sections retrieved successfully"
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

export const createClassSection = async (req, res) => {
    try {
        const { sectionName, gradeLevel, students, courses } = req.body;

        if (!sectionName || !gradeLevel) {
            return res.status(400).json({
                success: false,
                message: "Section name and grade level are required."
            });
        }

        const newSection = await ClassSection.create({
            sectionName: sectionName.trim(),
            gradeLevel,
            students: students || [], 
            courses: courses || []
        });

        // If courses were provided during creation, sync them to teacher profiles
        if (courses && Array.isArray(courses) && courses.length > 0) {
            const teacherUpdatePromises = courses.map(async (item) => {
                if (item.teacher && item.course) {
                    const teacherId = typeof item.teacher === 'object' ? item.teacher._id : item.teacher;
                    const courseId = typeof item.course === 'object' ? item.course._id : item.course;

                    await StaffProfile.findByIdAndUpdate(
                        teacherId,
                        {
                            $addToSet: { 
                                assignedCourses: courseId,
                                assignedSections: newSection._id 
                            }
                        }
                    );
                }
            });

            await Promise.all(teacherUpdatePromises);
        }

        return res.status(201).json({
            success: true,
            message: "Class section created successfully and synced to teachers.",
            data: newSection
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message || "Internal server error."
        });
    }
};