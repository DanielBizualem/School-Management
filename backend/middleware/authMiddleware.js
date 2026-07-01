import jwt from "jsonwebtoken";

// Middleware to verify if the user is logged in via their Access Token
export const protect = async (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
        try {
            token = req.headers.authorization.split(" ")[1];
            
            // VERIFY USING ACCESS SECRET
            const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);

            if (decoded.role === 'teacher' || decoded.role === 'director') {
                const staff = await StaffProfile.findOne({ user: decoded.id });
                req.user.staffId = staff?._id; 
            }
            
            req.user = { id: decoded.id, role: decoded.role };
            return next();
        } catch (error) {
            return res.status(401).json({ message: "Access token invalid or expired." });
        }
    }
    
    return res.status(401).json({ message: "Authorization token required." });
};

// ADDED: Middleware to restrict access based on user roles (admin, teacher, student, etc.)
export const authorizeRoles = (...roles) => {
    return (req, res, next) => {
        // 'protect' middleware runs first, attaching req.user
        if (!req.user || !roles.includes(req.user.role)) {
            return res.status(403).json({ 
                message: `Forbidden: Role '${req.user?.role || "unknown"}' is not authorized to access this resource.` 
            });
        }
        next();
    };
};