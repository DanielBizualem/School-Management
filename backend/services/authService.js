import { User } from "../models/User.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
// Import your new utility helpers
import { generateAccessToken, generateRefreshToken } from "../utils/utilsToken.js";

export const loginUser = async ({ email, password }) => {
    const user = await User.findOne({ email });
    if (!user) throw new Error("INVALID_CREDENTIALS");

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) throw new Error("INVALID_CREDENTIALS");

    // Use the utility functions here
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    user.refreshTokens.push(refreshToken);
    await user.save();

    return {
        accessToken,
        refreshToken,
        user: { id: user._id, email: user.email, role: user.role, isFirstLogin: user.isFirstLogin }
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