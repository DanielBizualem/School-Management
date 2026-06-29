import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true }, // Hashed password
    role: {
        type: String, 
        required: true, 
        enum: ["admin", "director", "teacher", "student"] 
    },
    isFirstLogin: { type: Boolean, default: true },
    refreshTokens: [{ type: String }]
}, { timestamps: true });

export const User = mongoose.models.User || mongoose.model("User", userSchema);