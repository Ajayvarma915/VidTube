import {v2 as cloudinary} from 'cloudinary'
import fs from 'fs'
//configure cloudinary
import dotenv from 'dotenv'

dotenv.config({
    path:'./.env'
})

cloudinary.config({
    cloud_name:process.env.CLOUDINARY_NAME,
    api_key:process.env.CLOUDINARY_API_KEY,
    api_secret:process.env.CLOUDINARY_API_SECRET
})

const uploadOnCloudinary= async(localFilePath)=>{
    try {
        if(!localFilePath) return null;
        const uploadResult=await cloudinary.uploader.upload(
            localFilePath,{
                resource_type:'auto'
            }
        )

        console.log('File uploaded on cloudinary. File src: ',uploadResult.url);
        //once the file is uploaded to cloudinary, we will remove it from our server.
        fs.unlinkSync(localFilePath);
        return uploadResult;
    } catch (error) {
        console.log("Error on Cloudinary",error)
        fs.unlinkSync(localFilePath);
        return null;
    }
}

const deleteFromCloudinary=async(publicId)=>{
    try {
        const result=await cloudinary.uploader.destroy(publicId);
        console.log("deleted from cloudinary successfully public Id: ",publicId);
    } catch (error) {
        console.log('error deleting from cloudinary ',error);
        return null;
    }
}

export {uploadOnCloudinary,deleteFromCloudinary};