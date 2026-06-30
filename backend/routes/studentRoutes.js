import express from "express";
import {  fileComplaint, viewMyDashboard } from "../controllers/studentController.js";
import { protect, authorizeRoles } from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(protect, authorizeRoles("student"));

router.get("/dashboard",protect, authorizeRoles("student"), viewMyDashboard);
router.post("/complaint", fileComplaint);

export default router;