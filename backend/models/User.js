import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    email: { type: String, unique: true, sparse:true },
    password: { type: String, required: true }, // Hashed password
    employeeID: { type: String, unique: true, sparse: true },
    role: {
        type: String, 
        required: true, 
        enum: ["admin", "director", "teacher", "student"] 
    },
    isFirstLogin: { type: Boolean, default: true },
    refreshTokens: [{ type: String, select: false }] 
}, { timestamps: true });

export const User = mongoose.models.User || mongoose.model("User", userSchema);