import express from "express";
import { updateStudentGrade, generateEvaluationText, register, updateTeacher, getTeacherDetails} from "../controllers/teacherController.js";
import { protect, authorizeRoles } from "../middleware/authMiddleware.js";
import { getStudentsByCourse, getTeacherCourses, updateStudentGrades } from "../controllers/studentController.js";

const router = express.Router();

router.use(protect, authorizeRoles("teacher"));

router.put("/update-grade", updateStudentGrade);
router.post("/generate-evaluation", generateEvaluationText);
router.post('/register', protect, authorizeRoles('admin'), register);
router.get('/teacherDetail', protect, getTeacherDetails);
router.get('/courses',protect,authorizeRoles('teacher'),getTeacherCourses)
router.get('/courseStudent/:courseId',protect,authorizeRoles('teacher'),getStudentsByCourse)
router.post('/updateGrade',protect,authorizeRoles('teacher'),updateStudentGrades)



export default router;