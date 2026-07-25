import express from 'express';
import multer from 'multer';
import { uploadToCloudinary } from '../utils/upload.js'; // Your existing utility
import { uploadImageController } from '../controllers/uploadContoller.js';
import upload from '../middleware/multer.js';

const router = express.Router();

router.post(
    "/image", 
    // protect, 
    // authorizeRoles("admin", "teacher"), // Restrict access as needed
    upload.single("image"),               // "image" matches the FormData key sent from frontend
    uploadImageController
);

export default router;