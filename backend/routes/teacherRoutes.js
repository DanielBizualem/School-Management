import express from "express";
import { updateStudentGrade } from "../controllers/teacherController.js";
import { protect, authorizeRoles } from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(protect, authorizeRoles("teacher"));

router.put("/update-grade", updateStudentGrade);

export default router;