import cloudinary from '../config/Cloudinary.js';

export const uploadToCloudinary = async (fileBuffer) => {
  return new Promise((resolve, reject) => {
    cloudinary.uploader.upload_stream({ resource_type: "image" }, (error, result) => {
      if (error) reject(error);
      resolve(result.secure_url);
    }).end(fileBuffer);
  });
};