import mongoose from 'mongoose';

const assessmentSchema = new mongoose.Schema({
    title: { type: String, required: true },
    maxScore: { type: Number, required: true, default: 0 }
});

const studentAssessmentScoreSchema = new mongoose.Schema({
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'StudentProfile', required: true },
    scores: [{
        assessmentTitle: { type: String, required: true },
        score: { type: Number, default: 0 }
    }]
});

const courseGradeConfigSchema = new mongoose.Schema({
    course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
    section: { type: mongoose.Schema.Types.ObjectId, ref: 'ClassSection', required: true },
    semester: { type: String, enum: ['semester1', 'semester2'], required: true },
    assessments: [assessmentSchema], // Teacher-submitted maximum scores for the section
    studentScores: [studentAssessmentScoreSchema] // Individual student scores mapped by ID
}, { timestamps: true });

// Prevent duplicate configurations for the same course, section, and semester
courseGradeConfigSchema.index({ course: 1, section: 1, semester: 1 }, { unique: true });

export const CourseGradeConfig = mongoose.models.CourseGradeConfig || mongoose.model('CourseGradeConfig', courseGradeConfigSchema);

export default CourseGradeConfig;