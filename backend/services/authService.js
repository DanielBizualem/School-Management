import { User } from "../models/User.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
// Import your new utility helpers
import { generateAccessToken, generateRefreshToken } from "../utils/utilsToken.js";


import { StudentProfile } from "../models/StudentProfile.js";
import { ParentProfile } from "../models/ParentProfile.js";
import { StaffProfile } from "../models/staffProfile.js"; // Assuming you have this model
import { Admin } from "../models/adminProfile.js"; // Assuming you have these models


export const loginUser = async ({ email, password }) => {
    // 1. Authenticate user
    const user = await User.findOne({ email });
    if (!user) throw new Error("INVALID_CREDENTIALS");

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) throw new Error("INVALID_CREDENTIALS");

    // 2. Fetch specific profile based on role
    // This allows us to return the profile data needed for the specific dashboard
    let profile = null;
    
    switch (user.role) {
        case "student":
            profile = await StudentProfile.findOne({ user: user._id });
            break;
        case "parent":
            profile = await ParentProfile.findOne({ user: user._id });
            break;
        case "teacher":
            profile = await StaffProfile.findOne({ user: user._id });
            break;
        case "admin":
            profile = await Admin.findOne({ user: user._id });
            break;
        case "director":
            profile = await StaffProfile.findOne({ user: user._id });
            break;
        default:
            profile = null;
    }

    // 3. Generate tokens
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    user.refreshTokens.push(refreshToken);
    await user.save();

    return {
        accessToken,
        refreshToken,
        user: { 
            id: user._id, 
            email: user.email, 
            role: user.role, 
            isFirstLogin: user.isFirstLogin,
            profile // Frontend now receives the profile object directly
        }
    };
};

export const refreshUserSession = async (incomingRefreshToken) => {
    if (!incomingRefreshToken) throw new Error("TOKEN_REQUIRED");

    const decoded = jwt.verify(incomingRefreshToken, process.env.JWT_REFRESH_SECRET);

    const user = await User.findById(decoded.id);
    if (!user || !user.refreshTokens.includes(incomingRefreshToken)) {
        throw new Error("INVALID_REFRESH_TOKEN");
    }

    user.refreshTokens = user.refreshTokens.filter(t => t !== incomingRefreshToken);
    
    // Use the utility functions here too
    const newAccessToken = generateAccessToken(user);
    const newRefreshToken = generateRefreshToken(user);

    user.refreshTokens.push(newRefreshToken);
    await user.save();

    return { accessToken: newAccessToken, refreshToken: newRefreshToken };
};

export const logoutUser = async (activeRefreshToken) => {
    const decoded = jwt.decode(activeRefreshToken);
    if (decoded) {
        await User.findByIdAndUpdate(decoded.id, {
            $pull: { refreshTokens: activeRefreshToken }
        });
    }
};