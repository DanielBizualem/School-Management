import { loginUser, refreshUserSession, logoutUser } from "../services/authService.js";

export const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const data = await loginUser({ email, password });

        return res.status(200).json({
            message: "Login successful",
            accessToken: data.accessToken,
            refreshToken: data.refreshToken, // Can be sent via body or HTTP-Only cookie
            user: data.user
        });
    } catch (error) {
        if (error.message === "INVALID_CREDENTIALS") return res.status(401).json({ message: "Invalid credentials." });
        return res.status(500).json({ error: error.message });
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