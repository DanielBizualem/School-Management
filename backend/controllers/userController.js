import { getUserDetails } from "../services/userService.js";

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