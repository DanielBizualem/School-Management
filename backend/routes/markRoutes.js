import express from "express";
import { insertStudentMark } from "../controllers/markController.js";
import { protect, authorizeRoles } from "../middleware/authMiddleware.js";

const router = express.Router();

// Route: POST /api/marks/add
// This will first verify the login (protect), then verify the role (teacher)
router.post(
    "/add", 
    protect, 
    authorizeRoles("teacher"), 
    insertStudentMark
);

export default router;