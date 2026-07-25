import { v2 as cloudinary } from 'cloudinary';

// Function to configure and return cloudinary instance safely at runtime
export const getCloudinary = () => {
    cloudinary.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET,
    });
    return cloudinary;
};

export default cloudinary;