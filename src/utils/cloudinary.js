import {v2 as cloudinary} from 'cloudinary'
import fs from 'fs'
//configure cloudinary

cloudinary.config({
    cloud_name:process.env.CLOUDINARY_NAME,
    api_key:process.env.CLOUDINARY_API_KEY,
    api_secret:process.env.CLOUDINARY_API_SECRET
})

const uploadOnCloudinary= async(localFilePath)=>{
    try {
        if(!localFilePath) return null;
        const uploadResult=await cloudinary.upload(
            localFilePath,{
                resource_path:'auto'
            }
        )

        console.log('File uploaded on cloudinary. File src: ',uploadResult.url);
        //once the file is uploaded to cloudinary, we will remove it from our server.
        fs.unlinkSync(localFilePath);
        return uploadResult;
    } catch (error) {
        fs.unlinkSync(localFilePath);
        return null;
    }
}

export {uploadOnCloudinary};