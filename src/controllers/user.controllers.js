import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHander } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.models.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";

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

    const avatar=await uploadOnCloudinary(avatarLocalPath);
    let coverImage=''
    if(coverLocalPath){
        coverImage=await uploadOnCloudinary(coverLocalPath);
    }

    const user=await User.create({
        fullName,
        avatar: avatar.url,
        coverImage:coverImage.url,
        email,
        password,
        username:username.toLowerCase()
    })

    const findUser=await User.findById(user._id).select("-password -refreshToken");
    if(!findUser){
        throw new ApiError(500,"User creation failed!!!");
    }

    return res.status(201).json(new ApiResponse(200,user,"user created successfully"));
})


export {registerUser}