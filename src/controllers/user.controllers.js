import { ApiResponse } from "../utils/ApiResponse";
import { asyncHander } from "../utils/asyncHandler";
import { ApiError } from "../utils/ApiError";
import { User } from "../models/user.models";
import { uploadOnCloudinary } from "../utils/cloudinary";

const registerUser=asyncHander(async (req,res)=>{
    const {fullName,email,username,password}=req.body;

    if([fullName,email,username,password].some((field)=>field?.trim()==="")){
        throw new ApiError(400,"All fields are required!!!")
    }

    const existingUser=await User.findOne({$or:[{username},{email}]});
    if(existingUser){
        throw new ApiError(409,"User already exists")
    }
    
    const avatarLocalPath=req.files?.avatar[0]?.path
    const coverLocalPath=req.files?.avatar[0]?.path
    
    if(!avatarLocalPath){
        throw new ApiError(400,"Avatar file is missing")
    }

    uploadOnCloudinary(avatarLocalPath)
})


export {registerUser}