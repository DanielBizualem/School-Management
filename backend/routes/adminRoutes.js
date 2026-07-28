import express from "express";
import { registerStudent, registerTeacher, registerDirector, addCourse, createAdmin, getAllStudents, getAdminDetailController, registerCourse, initializeSettings, updateSettings, assignTeacherToSection, getAllClassSections, createClassSection, addTeacherRoleController, toggleRegistrationWindow, getRegistrationStatus, approveStudentRegistration, getPendingRegistrations } from "../controllers/adminController.js";
import { protect, authorizeRoles } from "../middleware/authMiddleware.js";
import multer from 'multer';
import { getTeachers, register } from "../controllers/teacherController.js";
import { updateTeacher } from "../controllers/teacherController.js";
import { createDirector, getAllCourses } from "../controllers/directorController.js";
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
//router.get("/get-all-courses",protect,authorizeRoles('admin'),getAllCourses);
router.get("/get-all-students",protect,authorizeRoles('admin','director'),getAllStudents)
router.post('/register', 
    authorizeRoles('admin'),
    createAdmin
);
router.post('/registerTeachers', protect, authorizeRoles('admin'), register);
router.get('/getAllTeachers',protect, authorizeRoles('admin','director'), getTeachers);
router.get('/getAdminDetail', protect, authorizeRoles('admin'),getAdminDetailController)
router.patch("/updateTeacher",protect,authorizeRoles("admin"), updateTeacher);
router.post('/assignTeacher',protect,authorizeRoles('admin','director'),assignTeacherToSection)
router.post("/registerCourse",protect, authorizeRoles("admin","director"), addCourse);
router.post("/initializeYear",protect, authorizeRoles("admin"), initializeSettings)
router.patch("/updateSetting",protect,authorizeRoles("admin"), updateSettings);
router.get('/getAllClassSection',protect,authorizeRoles('admin','teacher','director'),getAllClassSections)
router.post('/createClassSection',protect,authorizeRoles('admin','director'),createClassSection)
router.post("/add-role", protect, authorizeRoles('admin'), addTeacherRoleController);
router.post('/createAdmin',protect,authorizeRoles('admin'),createDirector)
router.post("/registration-control", protect, authorizeRoles("admin"), toggleRegistrationWindow);
router.get("/registration-status", protect, authorizeRoles("admin", "director","student"), getRegistrationStatus);
router.put("/registration-approve/:registrationId",protect,authorizeRoles('admin'), approveStudentRegistration);
router.get("/pending-registrations", protect, authorizeRoles("admin", "director"), getPendingRegistrations);
export default router;