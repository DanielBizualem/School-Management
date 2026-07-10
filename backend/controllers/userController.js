import { getUserDetails, updateUserData, updateUserPassword } from "../services/userService.js";

export const getUserDetailsController = async (req, res) => {
    try {
        // Ensure your auth middleware attaches the user object to 'req'
        const userId = req.user.id; 
        
        const userData = await getUserDetails(userId);
        
        return res.status(200).json({ 
            success: true, 
            data: userData 
        });
    } catch (error) {
        console.error("USER_DETAILS_ERROR:", error);
        
        const status = error.message === "USER_NOT_FOUND" ? 404 : 400;
        return res.status(status).json({ 
            success: false, 
            message: error.message 
        });
    }
};

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