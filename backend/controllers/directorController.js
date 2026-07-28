import { getSystemAnalytics, trackTeacherAttendance, generateGlobalRoster,getStrugglingCoursesByGrade } from "../services/directorService.js";
import {ClassSection} from '../models/classSection.js'
import mongoose from "mongoose";
import { User } from "../models/User.js";
import bcrypt from "bcryptjs";
import { DirectorProfile } from "../models/directorProfile.js";
import { Course } from "../models/Course.js";


export const createDirector = async (req, res) => {
    const { email, password, fullName, employeeID, phoneNumber } = req.body;

    // Start a Mongoose session for the transaction
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        // 1. Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            await session.abortTransaction();
            return res.status(400).json({ message: "Email already registered" });
        }

        // 2. Hash the password
        const hashedPassword = await bcrypt.hash(password, 12);

        // 3. Create the User (Auth record with role set to "director")
        const newUser = await User.create([{
            email,
            password: hashedPassword,
            role: "director"
        }], { session });

        // 4. Create the Director Profile record
        await DirectorProfile.create([{
            user: newUser[0]._id,
            fullName,
            employeeID,
            phoneNumber,
        }], { session });

        // Commit the transaction
        await session.commitTransaction();
        
        res.status(201).json({ message: "Director created successfully" });

    } catch (error) {
        // If anything fails, undo all changes
        await session.abortTransaction();
        res.status(500).json({ message: "Error creating director", error: error.message });
    } finally {
        session.endSession();
    }
};

export const viewDashboardAnalytics = async (req, res) => {
    try {
        // Run both service operations concurrently to keep response times fast
        const [metrics, strugglingCoursesData] = await Promise.all([
            getSystemAnalytics(),
            getStrugglingCoursesByGrade()
        ]);

        // Combine everything into a clean, unified response object
        return res.status(200).json({
            success: true,
            generalMetrics: metrics,                 // Your old analytics data stays intact
            strugglingCourses: strugglingCoursesData  // Your new grade-separated chart data
        });
    } catch (err) {
        return res.status(500).json({ 
            success: false, 
            error: err.message 
        });
    }
};

export const logTeacherAttendance = async (req, res) => {
    try {
        const { teacherId } = req.params;
        const log = await trackTeacherAttendance(teacherId, req.body);
        res.status(200).json({ message: "Attendance tracked successfully", log });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};

export const downloadRosterData = async (req, res) => {
    try {
        const roster = await generateGlobalRoster();
        res.status(200).json(roster);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

//recent added api's

export const assignHomeroomTeacher = async (req, res) => {
    try {
        const { sectionId } = req.params;
        const { teacherId } = req.body;

        const updatedSection = await ClassSection.findByIdAndUpdate(
            sectionId,
            { homeroomTeacher: teacherId },
            { new: true }
        ).populate({
            path: 'homeroomTeacher',
            select: 'fullName staffID' // Adjust fields based on your StaffProfile model structure
        });

        if (!updatedSection) {
            return res.status(404).json({ 
                success: false, 
                message: "Class section not found" 
            });
        }

        return res.status(200).json({
            success: true,
            message: "Homeroom teacher assigned successfully",
            data: updatedSection
        });

    } catch (error) {
        console.error("Error assigning homeroom teacher:", error);
        return res.status(500).json({ 
            success: false, 
            message: error.message 
        });
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

