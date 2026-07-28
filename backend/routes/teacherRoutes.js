import express from "express";
import { updateStudentGrade, generateEvaluationText, register, updateTeacher, getTeacherDetails, saveSectionMaxScores, getStudentScoresForTeacher, getStudentAnalytics, getTeacherCoursesAndSections, getStudentScoreSheetTable, getAcademicYearConfigs, sectionRosterController} from "../controllers/teacherController.js";
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
router.get('/analytics', protect, authorizeRoles('teacher'), getStudentAnalytics);
router.get('/courseSections', protect, authorizeRoles('teacher'), getTeacherCoursesAndSections);
router.get('/score-sheet-table', protect, authorizeRoles('teacher'), getStudentScoreSheetTable);
router.get('/academic-year-configs',protect,authorizeRoles('teacher'), getAcademicYearConfigs);
router.get('/section-roster', protect, authorizeRoles('teacher'), sectionRosterController);


export default router;