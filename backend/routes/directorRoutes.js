import express from "express";
import { viewDashboardAnalytics, logTeacherAttendance, downloadRosterData, assignHomeroomTeacher, getDirectorAnalytics, getStudentTranscript } from "../controllers/directorController.js";
import { protect, authorizeRoles } from "../middleware/authMiddleware.js";
import { getAllCourses } from "../controllers/directorController.js";

const router = express.Router();

router.get("/analytics", authorizeRoles('director'),viewDashboardAnalytics);
router.post("/attendance/:teacherId", authorizeRoles('director'), logTeacherAttendance);
router.get("/roster", authorizeRoles('director'), downloadRosterData);
router.put('/:sectionId/homeroom', protect, authorizeRoles('director'), assignHomeroomTeacher);
router.get("/get-all-courses",protect, authorizeRoles("director","admin"), getAllCourses);
router.put("/sections/:sectionId/homeroom-teacher", assignHomeroomTeacher);
router.get('/studentAnalytics', protect, authorizeRoles('director'), getDirectorAnalytics);
router.get('/transcript', protect, authorizeRoles('director', 'admin', 'teacher'), getStudentTranscript);


export default router;