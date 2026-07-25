import { getCloudinary } from "../config/cloudinary.js";

export const uploadImageController = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: "No image file provided."
            });
        }

        const cloudinaryInstance = getCloudinary();

        const uploadStreamToCloudinary = (fileBuffer) => {
            return new Promise((resolve, reject) => {
                const stream = cloudinaryInstance.uploader.upload_stream(
                    {
                        folder: "school_management/students",
                        resource_type: "image",
                    },
                    (error, result) => {
                        if (error) reject(error);
                        else resolve(result);
                    }
                );
                stream.end(fileBuffer);
            });
        };

        const uploadResult = await uploadStreamToCloudinary(req.file.buffer);

        return res.status(200).json({
            success: true,
            message: "Image uploaded successfully",
            url: uploadResult.secure_url,
            public_id: uploadResult.public_id
        });

    } catch (error) {
        console.error("Cloudinary upload error:", error);
        return res.status(500).json({
            success: false,
            message: error.message || "Failed to upload image to Cloudinary"
        });
    }
};