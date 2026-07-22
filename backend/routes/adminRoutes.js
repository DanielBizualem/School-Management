import express from "express";
import { registerStudent, registerTeacher, registerDirector, addCourse, createAdmin, getAllCourses, getAllStudents, getAdminDetailController, registerCourse, initializeSettings, updateSettings, assignTeacherToSection, getAllClassSections, createClassSection } from "../controllers/adminController.js";
import { protect, authorizeRoles } from "../middleware/authMiddleware.js";
import multer from 'multer';
import { getTeachers, register } from "../controllers/teacherController.js";
import { updateTeacher } from "../controllers/teacherController.js";
const upload = multer({ storage: multer.memoryStorage() });

const router = express.Router();

// All routes here require a valid admin access token
//router.use(protect, authorizeRoles("admin"));

router.post("/register-student", protect, authorizeRoles('admin'),upload.fields([
    { name: 'studentPhoto', maxCount: 1 }, 
    { name: 'familyPhoto', maxCount: 1 }
]), registerStudent);

router.post("/register-teacher", register);
router.post("/register-director", registerDirector);
router.post("/create-course", addCourse);
router.get("/get-all-courses",protect,authorizeRoles('admin'),getAllCourses);
router.get("/get-all-students",protect,authorizeRoles('admin'),getAllStudents)
router.post('/register', 
    authorizeRoles('admin'),
    createAdmin
);
router.post('/registerTeachers', protect, authorizeRoles('admin'), register);
router.get('/getAllTeachers',protect, authorizeRoles('admin'), getTeachers);
router.get('/getAdminDetail', protect, authorizeRoles('admin'),getAdminDetailController)
router.patch("/updateTeacher",protect,authorizeRoles("admin"), updateTeacher);
router.post('/assignTeacher',protect,authorizeRoles('admin'),assignTeacherToSection)
router.post("/registerCourse",protect, authorizeRoles("admin"), addCourse);
router.get("/getAllCourse",protect, authorizeRoles("admin"), getAllCourses);
router.post("/initializeYear",protect, authorizeRoles("admin"), initializeSettings)
router.patch("/updateSetting",protect,authorizeRoles("admin"), updateSettings);
router.get('/getAllClassSection',protect,authorizeRoles('admin','teacher'),getAllClassSections)
router.post('/createClassSection',protect,authorizeRoles('admin'),createClassSection)

export default router;