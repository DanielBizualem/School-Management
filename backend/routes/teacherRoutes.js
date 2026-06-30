import express from "express";
import { updateStudentGrade, generateEvaluationText } from "../controllers/teacherController.js";
import { protect, authorizeRoles } from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(protect, authorizeRoles("teacher"));

router.put("/update-grade", updateStudentGrade);
router.post("/generate-evaluation", generateEvaluationText);

export default router;