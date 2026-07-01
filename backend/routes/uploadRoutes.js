import express from 'express';
import multer from 'multer';
import { uploadToCloudinary } from '../utils/upload.js'; // Your existing utility

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.post('/upload/image', upload.single('file'), async (req, res) => {
    try {
        const url = await uploadToCloudinary(req.file.buffer);
        res.json({ url });
    } catch (error) {
        res.status(500).json({ message: "Upload failed" });
    }
});

export default router;