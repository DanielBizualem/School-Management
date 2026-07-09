import { User } from "../models/User.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
// Import your new utility helpers
import { generateAccessToken, generateRefreshToken } from "../utils/utilsToken.js";


import { StudentProfile } from "../models/StudentProfile.js";
import { ParentProfile } from "../models/ParentProfile.js";
import { StaffProfile } from "../models/staffProfile.js"; // Assuming you have this model
import { Admin } from "../models/adminProfile.js"; // Assuming you have these models


export const loginUser = async ({ identifier, password }) => {
    // 1. Authenticate user
    const user = await User.findOne({
        $or: [
            { email: identifier },
            { employeeID: identifier }
        ]
    });
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

    //user.refreshTokens.push(refreshToken);
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

export const refreshUserSession = async (refreshToken) => {
    if (!refreshToken) throw new Error("No Refresh Token provided");
    const decoded = jwt.verify(refreshToken, process.env.SECRET_REFRESH_TOKEN);

    const user = await User.findById(decoded.id);
    
    if (!user || user.refreshToken !== refreshToken) {
        throw new Error("Invalid Refresh Token");
    }

    const newAccessToken = await generateAccessToken(user._id);
    
    return { accessToken: newAccessToken };
};

export const logoutUser = async (activeRefreshToken) => {
    const decoded = jwt.decode(activeRefreshToken);
    if (decoded) {
        await User.findByIdAndUpdate(decoded.id, {
            $pull: { refreshTokens: activeRefreshToken }
        });
    }
};