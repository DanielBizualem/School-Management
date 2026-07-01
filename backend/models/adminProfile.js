
import mongoose from "mongoose";

const adminProfileSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    fullName: { type: String, required: true, trim: true },
    adminID: { type: String, required: true, unique: true },
    department: { type: String, required: true },
    phoneNumber: { type: String, required: true },
    permissions: [{
        type: String,
        enum: ["manage_users", "view_reports", "edit_settings", "manage_content"] 
    }]
}, { timestamps: true });

export const Admin = mongoose.models.Admin || mongoose.model("Admin", adminProfileSchema);