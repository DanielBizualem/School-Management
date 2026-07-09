import { User } from "../models/User.js";
import { StaffProfile } from "../models/StaffProfile.js";
import { StudentProfile } from "../models/StudentProfile.js";
import { Admin } from "../models/adminProfile.js";

export const getUserDetails = async (userId) => {
    if (!userId) throw new Error("USER_ID_REQUIRED");

    // 1. Fetch base user info, excluding sensitive security fields
    const user = await User.findById(userId).select("-password -refreshTokens");
    if (!user) throw new Error("USER_NOT_FOUND");

    // 2. Fetch the role-specific profile
    let profile = null;
    
    // Switch based on the user's role stored in the User model
    switch (user.role) {
        case "teacher":
        case "director":
            profile = await StaffProfile.findOne({ user: userId });
            break;
        case "student":
            profile = await StudentProfile.findOne({ user: userId });
            break;
        case "admin":
            profile = await Admin.findOne({ user: userId });
            break;
    }

    // 3. Return combined data
    return {
        ...user.toObject(),
        profile
    };
};