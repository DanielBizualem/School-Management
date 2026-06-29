import express from "express";
import { viewDashboardAnalytics, logTeacherAttendance, downloadRosterData } from "../controllers/directorController.js";
import { protect, authorizeRoles } from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(protect, authorizeRoles("director"));

router.get("/analytics", viewDashboardAnalytics);
router.post("/attendance/:teacherId", logTeacherAttendance);
router.get("/roster", downloadRosterData);

export default router;