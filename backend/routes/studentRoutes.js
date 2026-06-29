import express from "express";
import { viewGradesAndProfile, fileComplaint } from "../controllers/studentController.js";
import { protect, authorizeRoles } from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(protect, authorizeRoles("student"));

router.get("/dashboard", viewGradesAndProfile);
router.post("/complaint", fileComplaint);

export default router;