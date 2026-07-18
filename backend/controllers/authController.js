import { loginUser, refreshUserSession, logoutUser } from "../services/authService.js";

export const login = async (req, res) => {
    try {
        const { identifier, password } = req.body;
        console.log("Attempting login for:", identifier); // Log before calling service
        
        const data = await loginUser({ identifier, password });

        res.cookie("refreshToken", data.refreshToken, {
          httpOnly: true,
          secure: false, // Set to true only if using HTTPS
          sameSite: "lax", // 'lax' is safer for local development
          maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days (set to your preference)
      });
        
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
    const refreshToken = req.cookies.refreshToken;
    const result = await refreshUserSession(refreshToken);

    res.cookie("accessToken", result.accessToken, {
      httpOnly: true,
      secure: true,
      sameSite: "None",
    });

    return res.status(200).json({
      success: true,
      accessToken: result.accessToken,
    });
  } catch (error) {
    return res.status(401).json(error.message);
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