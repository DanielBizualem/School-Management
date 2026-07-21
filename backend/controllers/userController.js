import { getUserDetails, updateUserData, updateUserPassword } from "../services/userService.js";
import { StaffProfile } from "../models/StaffProfile.js";
import { StudentProfile } from "../models/StudentProfile.js";
//import AdminProfile from "../models/AdminProfile.js";



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
            profile = await AdminProfile.findOne({ user: userId });
        } else if (role === 'teacher' || role === 'director') {
            profile = await StaffProfile.findOne({ user: userId });
        } else if (role === 'student' || role === 'director') {
            profile = await StudentProfile.findOne({ user: userId });}
        else {
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