import express from "express";
import { registerStudent, registerTeacher, registerDirector, addCourse, createAdmin, getAllCourses, getAllStudents } from "../controllers/adminController.js";
import { protect, authorizeRoles } from "../middleware/authMiddleware.js";

const router = express.Router();

// All routes here require a valid admin access token
router.use(protect, authorizeRoles("admin"));

router.post("/register-student", registerStudent);
router.post("/register-teacher", registerTeacher);
router.post("/register-director", registerDirector);
router.post("/create-course", addCourse);
router.get("/get-all-courses",authorizeRoles('admin'),getAllCourses);
router.get("/get-all-students",authorizeRoles('admin'),getAllStudents)
router.post('/register', 
    authorizeRoles('admin'),
    createAdmin
);

export default router;