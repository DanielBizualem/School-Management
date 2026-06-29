import express from "express";
import { registerStudent, registerTeacher, registerDirector, addCourse } from "../controllers/adminController.js";
import { protect, authorizeRoles } from "../middleware/authMiddleware.js";

const router = express.Router();

// All routes here require a valid admin access token
router.use(protect, authorizeRoles("admin"));

router.post("/register-student", registerStudent);
router.post("/register-teacher", registerTeacher);
router.post("/register-director", registerDirector);
router.post("/create-course", addCourse);

export default router;