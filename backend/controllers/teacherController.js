import { submitStudentMark, getAIStudentEvaluation } from "../services/teacherService.js";

export const updateStudentGrade = async (req, res) => {
    const { studentId, courseId, mark } = req.body;
    
    // req.user.id is automatically populated by your protect authentication middleware
    const teacherUserId = req.user.id; 

    try {
        // 1. Structural Request Validation
        if (!studentId || !courseId || mark === undefined) {
            return res.status(400).json({ 
                success: false,
                message: "Missing parameters. studentId, courseId, and mark are all required." 
            });
        }

        // 2. Business Logic Validation (Ensure mark is realistic)
        if (mark < 0 || mark > 100) {
            return res.status(400).json({ 
                success: false,
                message: "Invalid mark value. Score must be a percentage between 0 and 180°C or 100%." 
            });
        }

        // 3. Execute Service Operation
        const updatedStudent = await submitStudentMark(teacherUserId, { 
            studentId, 
            courseId, 
            mark: Number(mark) // Enforce data type consistency as a number
        });

        // 4. Return Success Payload
        return res.status(200).json({
            success: true,
            message: "Student mark processed and logged successfully.",
            data: updatedStudent
        });

    } catch (error) {
        // 5. Catch Security and Structural Exceptions Cleanly
        if (error.message === "UNAUTHORIZED_COURSE_ACCESS") {
            return res.status(403).json({
                success: false,
                message: "Access Denied: You are not authorized to submit grades for this course curriculum."
            });
        }

        if (error.message === "STUDENT_NOT_FOUND") {
            return res.status(404).json({
                success: false,
                message: "Operation Failed: No student record matches the provided studentId."
            });
        }

        // Global fallback error
        return res.status(500).json({
            success: false,
            message: "Internal server error occurred while processing grade.",
            error: error.message
        });
    }
};


export const generateEvaluationText = async (req, res) => {
    const { studentId, courseId } = req.body;

    try {
        if (!studentId || !courseId) {
            return res.status(400).json({ message: "Student ID and Course ID are required." });
        }

        const evaluationReport = await getAIStudentEvaluation(studentId, courseId);
        
        return res.status(200).json({
            success: true,
            data: evaluationReport
        });
    } catch (error) {
        return res.status(500).json({ 
            success: false, 
            message: "Could not compile AI evaluation.", 
            error: error.message 
        });
    }
};