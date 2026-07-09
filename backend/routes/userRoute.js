import express from "express";
import { getUserDetailsController } from "../controllers/userController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/getUserDetail",protect, getUserDetailsController)

export default router;