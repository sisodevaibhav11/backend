import { v2 as cloudinary } from 'cloudinary';


cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});


const uploadOnCloudinary = async (localfilepath) => {
    try {
        if (!localfilepath) {
            return null;
        }
        const response = await cloudinary.uploader.upload(localfilepath, {
            resource_type: 'auto',
        });
        console.log('Cloudinary Upload Result:', response.secure_url);
        return response;
    } catch (error) {
        FileSystem.unlinkSync(localfilepath);//remove the locally stored file in case of error
        return null;
    }
};

export { uploadOnCloudinary };