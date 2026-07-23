import express from "express";
import { updateStudentGrade, generateEvaluationText, register, updateTeacher, getTeacherDetails, saveSectionMaxScores, getStudentScoresForTeacher} from "../controllers/teacherController.js";
import { protect, authorizeRoles } from "../middleware/authMiddleware.js";
import { getMaxScore, getStudentsByCourse, getTeacherCourses, updateStudentGrades } from "../controllers/studentController.js";

const router = express.Router();

router.use(protect, authorizeRoles("teacher"));

router.patch("/update-grade",protect,authorizeRoles('teacher'), updateStudentGrade);
router.post("/generate-evaluation", generateEvaluationText);
router.post('/register', protect, authorizeRoles('admin'), register);
router.get('/teacherDetail', protect, authorizeRoles('teacher'), getTeacherDetails);
router.get('/courses',protect,authorizeRoles('teacher'),getTeacherCourses)
router.get('/courseStudent/:courseId',protect,authorizeRoles('teacher'),getStudentsByCourse)
//router.post('/updateGrade',protect,authorizeRoles('teacher'),updateStudentGrades)
router.post('/maxScore',protect,authorizeRoles('teacher'),saveSectionMaxScores)
router.post('/updateGrade',protect,authorizeRoles('teacher'),updateStudentGrade)
router.get('/getMaxScore/:courseId/:sectionId/:semester',protect, authorizeRoles('teacher'),getMaxScore)
router.get('/viewScore/:courseId/:sectionId/:studentId', protect, authorizeRoles('teacher'), getStudentScoresForTeacher);



export default router;