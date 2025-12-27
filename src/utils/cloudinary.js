import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

const uploadOnCloudinary = async (localFilePath) => {
    try {
        if (!localFilePath) return null;

        // Upload the file to Cloudinary
        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type: "auto",
        });

        // SUCCESS: File uploaded, now remove it from our local server
        if (fs.existsSync(localFilePath)) {
            fs.unlinkSync(localFilePath);
        }

        // console.log('Cloudinary Upload Result:', response.url);
        fs.unlinkSync(localFilePath); // Clean up local file
        return response;

    } catch (error) {
        // FIXED: Changed 'FileSystem' to 'fs'
        console.error("Cloudinary Error:", error.message);

        if (fs.existsSync(localFilePath)) {
            fs.unlinkSync(localFilePath); // Clean up local file even if upload fails
        }

        return null;
    }
};

console.log("Cloudinary Config:", {
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY ? "LOADED" : "MISSING",
    api_secret: process.env.CLOUDINARY_API_SECRET ? "LOADED" : "MISSING",
});


export { uploadOnCloudinary };