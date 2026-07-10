import express from "express";
import { getUserDetailsController, updateSettingsController } from "../controllers/userController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/getUserDetail",protect, getUserDetailsController)
router.patch('/updateProfile',protect, updateSettingsController)

export default router;