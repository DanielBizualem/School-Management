import express from "express";
import { getUserDetail, updateSettingsController } from "../controllers/userController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/getUserDetail",protect, getUserDetail)
router.patch('/updateProfile',protect, updateSettingsController)
router.get("/me", protect, (req, res) => {
    res.json({ success: true, user: req.user });
});

export default router;