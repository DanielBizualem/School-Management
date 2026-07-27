import mongoose from "mongoose";
import bcrypt from "bcryptjs";


const directorProfileSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    fullName: { type: String, required: true, trim: true },
    employeeID: { type: String, required: true, unique: true },
    phoneNumber: { type: String, required: true },
}, { timestamps: true });

export const DirectorProfile = mongoose.models.DirectorProfile || mongoose.model("DirectorProfile", directorProfileSchema);