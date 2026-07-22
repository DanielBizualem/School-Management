import express from "express";
import {  fileComplaint, viewMyDashboard, getStudentTranscript, getStudentDashboardGrades} from "../controllers/studentController.js";
import { protect, authorizeRoles } from "../middleware/authMiddleware.js";


const router = express.Router();

router.use(protect, authorizeRoles("student"));

router.get("/dashboard",protect, authorizeRoles("student"), viewMyDashboard);
router.post("/complaint", fileComplaint);
//router.get("/get-all-students", protect, authorizeRoles("admin"), getAllStudents); // Admin route to fetch all students
router.get("/transcript", protect, authorizeRoles("student"), getStudentTranscript);
router.get('/viewScore',protect,authorizeRoles('student'),getStudentDashboardGrades)

export default router;