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
import { DirectorProfile } from "../models/directorProfile.js";
import { AcademicYearConfig } from "../models/AcademicYearConfig.js";
import {StudentRegistration} from '../models/StudentRegistration.js'


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
        const { gradeLevel, sectionName, students, course, academicYear } = req.body;

        if (!gradeLevel || !sectionName) {
            return res.status(400).json({ success: false, message: "Grade level and section name are required." });
        }

        // Find if the section already exists for this grade level & section name
        let section = await ClassSection.findOne({ 
            gradeLevel: gradeLevel, 
            sectionName: sectionName,
            course: course || null,
            academicYear: academicYear || null
        });

        if (section) {
            // Section exists! Add new students without duplicating existing ones
            if (students && Array.isArray(students)) {
                // Use $addToSet logic or push unique IDs
                students.forEach(studentId => {
                    if (!section.students.includes(studentId)) {
                        section.students.push(studentId);
                    }
                });
                await section.save();
            }

            return res.status(200).json({
                success: true,
                message: "Students successfully added to existing section!",
                data: section
            });
        } else {
            // Section doesn't exist, create a new one safely
            section = await ClassSection.create({
                gradeLevel,
                sectionName,
                students: students || [],
                course: course || null,
                academicYear: academicYear || null
            });

            return res.status(201).json({
                success: true,
                message: "Section created and students assigned successfully!",
                data: section
            });
        }
    } catch (error) {
        console.error("Error managing class section:", error);
        return res.status(500).json({ success: false, message: error.message });
    }
};
export const addTeacherRoleController = async(req, res) => {
    try {
        const { teacherId, newRole } = req.body; // e.g., teacherId can be the StaffProfile _id or employeeID

        // 1. Find the existing StaffProfile to get their details
        const staffProfile = await StaffProfile.findById(teacherId);
        if (!staffProfile) {
            return res.status(404).json({
                success: false,
                message: "Staff profile not found."
            });
        }

        const rolePrefix = newRole.toLowerCase() === "director" ? "DIR" : "EMP";
        const currentYearSuffix = "26"; // Or dynamically get current 2-digit year: new Date().getFullYear().toString().slice(-2)

        // 2. Find the latest user ID matching this prefix to calculate the next sequence number
        const latestUser = await User.findOne({ 
            employeeID: { $regex: `^${rolePrefix}/\\d+/${currentYearSuffix}$` } 
        }).sort({ createdAt: -1 });
        let nextNumber = 1;
        if (latestUser && latestUser.employeeID) {
            // Example format: "EMP/0006/26" -> split by "/" to get the middle number ("0006")
            const parts = latestUser.employeeID.split("/");
            if (parts.length >= 2) {
                const parsedNum = parseInt(parts[1], 10);
                if (!isNaN(parsedNum)) {
                    nextNumber = parsedNum + 1;
                }
            }
        }

        // Format number with leading zeros (e.g., 6 becomes "0006")
        const paddedNumber = String(nextNumber).padStart(4, "0");
        const newEmployeeID = `${rolePrefix}/${paddedNumber}/${currentYearSuffix}`;

        // 3. Generate a temporary password
        const tempPass = crypto.randomBytes(4).toString("hex"); // e.g., "a1b2c3d4"
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(tempPass, salt);

        // 4. Create a NEW User document for authentication with the new role and new ID
        const newUser = await User.create({
            employeeID: newEmployeeID,
            password: hashedPassword,
            role: newRole.toLowerCase(), // e.g., "director"
            isFirstLogin: true
        });

        // Optional: If you want to link multiple user accounts to a single StaffProfile, 
        // you can add a field like `userAccounts: [userId1, userId2]` in your StaffProfile schema.
        if (staffProfile.userAccounts) {
            staffProfile.userAccounts.push(newUser._id);
            await staffProfile.save();
        }

        // 5. Return the new credentials to the admin
        return res.status(200).json({
            success: true,
            message: `New ${newRole} account created successfully.`,
            data: {
                newID: newEmployeeID,
                tempPass: tempPass
            }
        });

    } catch (error) {
        console.error("Error adding role account:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
}
export const toggleRegistrationWindow = async (req, res) => {
    try {
        const { academicYear, targetGrade, isRegistrationOpen } = req.body;

        let config = await AcademicYearConfig.findOne({ academicYear, targetGrade });

        if (!config) {
            config = await AcademicYearConfig.create({
                academicYear,
                targetGrade,
                isRegistrationOpen
            });
        } else {
            config.isRegistrationOpen = isRegistrationOpen;
            await config.save();
        }

        res.status(200).json({
            success: true,
            message: `Registration for ${targetGrade} (${academicYear}) is now ${isRegistrationOpen ? "OPEN" : "CLOSED"}.`,
            data: config
        });
    } catch (error) {
        res.status(500).json({ success: true, message: error.message });
    }
};
export const getRegistrationStatus = async (req, res) => {
    try {
        const configs = await AcademicYearConfig.find({});
        res.status(200).json({ success: true, data: configs });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

function getNextGrade(currentGrade) {
    const match = currentGrade.match(/\d+/);
    if (!match) return currentGrade;
    const nextNum = parseInt(match[0], 10) + 1;
    return `Grade ${nextNum}`;
}

export const getStudentRegistrationStatus = async (req, res) => {
    try {
        const userId = req.user.id;

        // 1. Find student profile
        const studentProfile = await StudentProfile.findOne({ user: userId });
        if (!studentProfile) {
            return res.status(404).json({ success: false, message: "Student profile not found." });
        }

        // 2. Determine current grade using correct schema property (gradeLevel)
        const currentSection = await ClassSection.findOne({ students: studentProfile._id });
        const currentGrade = currentSection ? currentSection.gradeLevel : (studentProfile.currentGrade || studentProfile.gradeLevel);

        // 3. Gracefully handle brand-new or unassigned students without throwing errors
        if (!currentGrade) {
            return res.status(200).json({ 
                success: true, 
                currentGrade: null,
                targetGrade: null,
                data: [] 
            });
        }

        // 4. Compute eligible target grade
        const targetGrade = getNextGrade(currentGrade);

        // 5. Fetch registration config ONLY for their eligible target grade
        const configs = await AcademicYearConfig.find({ targetGrade });

        res.status(200).json({ 
            success: true, 
            currentGrade,
            targetGrade,
            data: configs 
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const approveStudentRegistration = async (req, res) => {
    try {
        const { registrationId } = req.params;

        const registration = await StudentRegistration.findById(registrationId).populate("student");
        if (!registration) {
            return res.status(404).json({ success: false, message: "Registration record not found." });
        }

        // 1. Mark registration as Approved
        registration.status = "Approved";
        await registration.save();

        const student = registration.student;

        // 2. Archive current active academic year data into academicHistory before overwriting
        if (student.gradeLevel && student.academicYear) {
            student.academicHistory.push({
                academicYear: student.academicYear,
                gradeLevel: student.gradeLevel,
                enrolledSections: student.enrolledSections,
                grades: student.grades
            });
        }

        // 3. Extract numeric grade from targetGrade string (e.g., "Grade 11" -> "11")
        const gradeMatch = registration.targetGrade.match(/\d+/);
        const newGradeLevel = gradeMatch ? gradeMatch[0] : registration.targetGrade;

        // 4. Update active profile fields for the new academic year
        student.gradeLevel = newGradeLevel;
        student.academicYear = registration.academicYear;
        student.enrolledSections = []; // Reset for new year's section assignment
        student.grades = [];         // Reset active course grades for the new year

        await student.save();

        res.status(200).json({
            success: true,
            message: `Registration approved. Student moved to Grade ${newGradeLevel} for ${registration.targetGrade}, and past history was successfully preserved.`,
            data: student
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const getPendingRegistrations = async (req, res) => {
    try {
        const registrations = await StudentRegistration.find({ status: "Pending" })
            .populate({
                path: "student",
                select: "fullName studentID gradeLevel gender academicYear"
            })
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            data: registrations
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};