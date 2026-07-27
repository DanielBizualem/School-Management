import { getUserDetails, updateUserData, updateUserPassword } from "../services/userService.js";
//import { StaffProfile } from "../models/StaffProfile.js";
import { StudentProfile } from "../models/StudentProfile.js";
//import AdminProfile from "../models/AdminProfile.js";
import {ClassSection} from '../models/classSection.js'
import { Admin } from "../models/adminProfile.js";
import { User } from "../models/User.js";
import { StaffProfile } from "../models/StaffProfile.js";
import {DirectorProfile} from '../models/directorProfile.js'



export const updateSettingsController = async (req, res) => {
    try {
        const userId = req.user.id;
        const { fullName, phoneNumber, currentPassword, newPassword } = req.body;

        // If password is being updated
        if (newPassword) {
            if (!currentPassword) throw new Error("CURRENT_PASSWORD_REQUIRED");
            await updateUserPassword(userId, currentPassword, newPassword);
        }

        // If profile details are being updated
        let profile = null;
        if (fullName || phoneNumber) {
            profile = await updateUserData(userId, { fullName, phoneNumber });
            
        }

        return res.status(200).json({ 
            success: true, 
            message: "Settings updated successfully",
            data: profile 
        });
    } catch (error) {
        return res.status(400).json({ success: false, message: error.message });
    }
};


export const getUserDetail = async (req, res) => {
    try {
        const userId = req.user.id;
        const role = req.user.role; // This comes from your JWT

        let profile;

        // Route logic based on role
        if (role === 'admin') {
            profile = await User.findById(userId) || await Admin.findOne({ user: userId });
        } else if (role === 'teacher') {
            profile = await StaffProfile.findOne({ user: userId });
        } else if (role === 'director') {
            // Option A: If a director maps to a StaffProfile (or has a specific director flag/collection)
            profile = await User.findById(userId) || await DirectorProfile.findOne({ user: userId });
        } else if (role === 'student') {
            profile = await StudentProfile.findOne({ user: userId });
            if (profile) {
                // Find the class section where this student's ID is included in the students array
                const assignedSection = await ClassSection.findOne({ students: profile._id })
                    .select('sectionName gradeLevel academicYear');
                
                // Attach it to the response data structure expected by your frontend
                profile.enrolledSections = assignedSection ? [assignedSection] : [];
            }
        } else {
            return res.status(403).json({ message: "Role profile not found." });
        }
        
        if (!profile) {
            return res.status(404).json({ message: "Profile not found." });
        }

        res.json({ success: true, data: profile, role });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};