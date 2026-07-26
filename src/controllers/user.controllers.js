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
        throw new ApiError(409,"User with email or username already exists")
    }
    
    console.warn(req.files)
    const avatarLocalPath=req.files?.avatar?.[0]?.path
    const coverLocalPath=req.files?.coverImage?.[0]?.path
    
    if(!avatarLocalPath){
        throw new ApiError(400,"Avatar file is missing")
    }

    // const avatar=await uploadOnCloudinary(avatarLocalPath);
    // let coverImage=''
    // if(coverLocalPath){
    //     coverImage=await uploadOnCloudinary(coverLocalPath);
    // }

    let avatar;
    try {
        avatar=await uploadOnCloudinary(avatarLocalPath);
        console.log("Avatar uploaded successfully")
    } catch (error) {
        console.log("Error uploading avatar ",error);
        throw new ApiError(500,"Failed to upload avatar");
    }

    let coverImage;
    try {
        coverImage=await uploadOnCloudinary(coverLocalPath);
        console.log("coverImage uploaded successfully")
    } catch (error) {
        console.log("Error uploading coverImage ",error);
        throw new ApiError(500,"Failed to upload coverImage");
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

    return res.status(201).json(new ApiResponse(200,findUser,"user created successfully"));
})


export {registerUser}