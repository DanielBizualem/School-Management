import mongoose from "mongoose";

const studentProfileSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    fullName: { type: String, required: true },
    studentID: { 
        type: String, 
        required: true, 
        unique: true,
        validate: {
            // Validates the precise format: std/anyNumber/twoDigitYear
            validator: function(v) {
                return /^std\/\d+\/\d{2}$/.test(v);
            },
            message: props => `${props.value} is not a valid student ID format! Must match 'std/_____/yy'`
        }
    },
    gradeLevel: { 
        type: String, 
        required: true, 
        enum: ["9th Grade", "10th Grade", "11th Grade", "12th Grade"] 
    },
    enrolledCourses: [{ type: mongoose.Schema.Types.ObjectId, ref: "Course" }],
    grades: [{
        course: { type: mongoose.Schema.Types.ObjectId, ref: "Course" },
        mark: { type: Number, default: 0 }
    }],
    complaints: [{
        course: { type: mongoose.Schema.Types.ObjectId, ref: "Course", required: true },
        subject: { type: String, required: true },
        description: { type: String, required: true },
        status: { type: String, default: "Pending", enum: ["Pending", "Resolved"] }
    }]
}, { timestamps: true });

export const StudentProfile = mongoose.models.StudentProfile || mongoose.model("StudentProfile", studentProfileSchema);