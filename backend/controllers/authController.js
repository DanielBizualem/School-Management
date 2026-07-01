import { loginUser, refreshUserSession, logoutUser } from "../services/authService.js";

export const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        console.log("Attempting login for:", email); // Log before calling service
        
        const data = await loginUser({ email, password });
        
        return res.status(200).json({
            success: true, // Make sure your frontend checks for this
            message: "Login successful",
            accessToken: data.accessToken,
            refreshToken: data.refreshToken,
            user: data.user
        });
    } catch (error) {
        // Log the full error to your server terminal so you can see it
        console.error("SERVER LOGIN ERROR:", error); 
        
        if (error.message === "INVALID_CREDENTIALS") {
            return res.status(401).json({ success: false, message: "Invalid credentials." });
        }
        
        // This is where you see the "500" error details in the response
        return res.status(500).json({ success: false, message: error.message });
    }
};

export const refreshSession = async (req, res) => {
    try {
        const { refreshToken } = req.body;
        const tokens = await refreshUserSession(refreshToken);

        return res.status(200).json({
            accessToken: tokens.accessToken,
            refreshToken: tokens.refreshToken // Refreshed to prevent session hijacking
        });
    } catch (error) {
        return res.status(401).json({ message: "Session expired or invalid refresh token. Please re-authenticate." });
    }
};

export const logout = async (req, res) => {
    try {
        const { refreshToken } = req.body;
        await logoutUser(refreshToken);
        return res.status(200).json({ message: "Successfully logged out." });
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
};