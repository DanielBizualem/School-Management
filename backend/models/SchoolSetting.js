import mongoose from "mongoose";

const schoolSettingsSchema = new mongoose.Schema({
    currentAcademicYear: { type: String, required: true },
    isRegistrationOpen: { type: Boolean, default: true }
});


export const SchoolSetting =  mongoose.models.SchoolSetting || mongoose.model("SchoolSetting", schoolSettingsSchema);