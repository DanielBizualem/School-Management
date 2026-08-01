import { loginUser, refreshUserSession, logoutUser } from "../services/authService.js";
import {User} from "../models/User.js";
import { sendOTPEmail } from "../services/emailService.js";
import bcrypt from "bcryptjs";

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

export const forgotPassword = async (req, res) => {
  try {
      const { email } = req.body;
      const user = await User.findOne({ email });

      if (!user) {
          return res.status(404).json({ success: false, message: "Email not found in our system" });
      }

      // Generate 6-digit OTP
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      
      user.resetPasswordOtp = otp;
      user.resetPasswordExpires = Date.now() + 10 * 60 * 1000; // 10 minutes expiry
      await user.save();

      await sendOTPEmail(email, otp);

      return res.status(200).json({ success: true, message: "OTP sent to your email" });
  } catch (error) {
      return res.status(500).json({ success: false, message: error.message });
  }
};

// 2. Verify OTP
export const verifyOtp = async (req, res) => {
  try {
      const { email, otp } = req.body;
      const user = await User.findOne({
          email,
          resetPasswordOtp: otp,
          resetPasswordExpires: { $gt: Date.now() }
      });

      if (!user) {
          return res.status(400).json({ success: false, message: "Invalid or expired OTP" });
      }

      return res.status(200).json({ success: true, message: "OTP verified successfully" });
  } catch (error) {
      return res.status(500).json({ success: false, message: error.message });
  }
};

// 3. Reset Password
export const resetPassword = async (req, res) => {
  try {
      const { email, otp, newPassword } = req.body;
      const user = await User.findOne({
          email,
          resetPasswordOtp: otp,
          resetPasswordExpires: { $gt: Date.now() }
      });

      if (!user) {
          return res.status(400).json({ success: false, message: "Session expired or invalid OTP" });
      }

      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(newPassword, salt);
      
      // Clear OTP fields and update first login status if applicable
      user.resetPasswordOtp = undefined;
      user.resetPasswordExpires = undefined;
      user.isFirstLogin = false; 
      
      await user.save();

      return res.status(200).json({ success: true, message: "Password updated successfully" });
  } catch (error) {
      return res.status(500).json({ success: false, message: error.message });
  }
};