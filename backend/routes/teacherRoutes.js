import express from "express";
import { updateStudentGrade, generateEvaluationText, register, updateTeacher} from "../controllers/teacherController.js";
import { protect, authorizeRoles } from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(protect, authorizeRoles("teacher"));

router.put("/update-grade", updateStudentGrade);
router.post("/generate-evaluation", generateEvaluationText);
router.post('/register', protect, authorizeRoles('admin'), register);
router.patch("/updateTeacher",protect,authorizeRoles("admin"), updateTeacher);

export default router;