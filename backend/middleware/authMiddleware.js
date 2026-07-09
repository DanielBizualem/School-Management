import jwt from "jsonwebtoken";
import { StaffProfile } from "../models/StaffProfile.js"; // Ensure this is imported

export const protect = async (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
        try {
            token = req.headers.authorization.split(" ")[1];
            const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);

            // 1. Initialize req.user first
            req.user = { id: decoded.id, role: decoded.role };

            // 2. Fetch staffId if applicable and attach to req.user
            if (decoded.role === 'teacher' || decoded.role === 'director') {
                const staff = await StaffProfile.findOne({ user: decoded.id });
                req.user.staffId = staff?._id; 
            }
            
            return next();
        } catch (error) {
            console.error("AUTH_ERROR:", error);
            return res.status(401).json({ message: "Access token invalid or expired." });
        }
    }
    
    return res.status(401).json({ message: "Authorization token required." });
};

// Role authorization remains the same and will work perfectly with the fixed req.user
export const authorizeRoles = (...roles) => {
    return (req, res, next) => {
        if (!req.user || !roles.includes(req.user.role)) {
            return res.status(403).json({ 
                message: `Forbidden: Role '${req.user?.role || "unknown"}' is not authorized.` 
            });
        }
        next();
    };
};