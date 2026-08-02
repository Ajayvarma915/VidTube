import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHander } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.models.js";
import { uploadOnCloudinary,deleteFromCloudinary } from "../utils/cloudinary.js";
import jwt from 'jsonwebtoken'

const generateAccessAndRefreshToken=async(userId)=>{
    try {
        const user=await User.findById(userId);
        
        if(!user){
            throw new ApiError(404,"User not found with the userId: ",userId);
        }

        const accessToken=await user.generateAccessToken();
        const refreshToken=await user.generateRefreshToken();

        user.refreshToken=refreshToken;
        await user.save({validateBeforeSave:false});

        return {accessToken,refreshToken};
    } catch (error) {
        console.log("error generating access and refresh token.");
        throw new ApiError(500,"error generating access and refresh tokens");
    }
}

const registerUser=asyncHander(async (req,res)=>{
    const {fullName,email,username,password}=req.body;

    if([fullName,email,username,password].some((field)=>field?.trim()==="")){
        throw new ApiError(400,"All fields are required!!!")
    }

    const existingUser=await User.findOne({$or:[{username},{email}]});
    if(existingUser){
        throw new ApiError(409,"User with email or username already exists")
    }
    
    // console.warn(req.files)
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


    try {
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
    } catch (error) {
        console.log("user creation failed")
        if(avatar){
            await deleteFromCloudinary(avatar.public_id)
        }
        if(coverImage){
            await deleteFromCloudinary(coverImage.public_id)
        }

        throw new ApiError(500,"Registering a user failed and images were deleted");
    }
})

const loginUser=asyncHander(async (req,res)=>{
    const {email,username,password}=req.body;

    if([email,password].some((field)=>field?.trim()==="")){
        throw new ApiError(404,"All fields are required");
    }

    const user=User.findOne({
        $or:[{email},{username}]
    })

    if(!user){
        throw new ApiError(404,"User doesn't exists");
    }

    const isPasswordCorrect=await user.isPasswordCorrect(password);

    if(!isPasswordCorrect) throw new ApiError(401,"Invalid Credentials");

    const {accessToken,refreshToken}=generateAccessAndRefreshToken(user._id);

    const loggedInUser=await User.findById(user._id).select("-password -refreshToken");

    const options={
        httpOnly:true,
        secure:process.env.NODE_ENV==='production',
    }

    return res.status(200)
    .cookie('accessToken',accessToken,options)
    .cookie('refreshToken',refreshToken,options)
    .json(new ApiResponse(200,loggedInUser,"User logged in successfully"))
})

const logoutUser=asyncHander(async (req,res)=>{
    user=await User.findByIdAndUpdate(
        req.user._id,
        {
            refreshToken:""
        },
        {new:true}
    )

    const options={
        httpOnly:true,
        secure: process.env.NODE_ENV==="production"
    }
    
    return res.status(200)
    .clearCookie('accessToken',options)
    .clearCookie('refreshToken',options)
    .json(new ApiResponse(200,{},"User logged out successfully"))
})

const refreshAccessToken=asyncHander(async (req,res)=>{
    const incomingRefreshToken=req.cookies.refreshToken || req.body.refreshToken;

    if(!incomingRefreshToken){
        throw new ApiError(401,"Refresh Token is required");
    }

    try {
        const decodedToken=jwt.verify(incomingRefreshToken,process.env.REFRESH_TOKEN_SECRET);

        const user=await User.findById(decodedToken._id);
        if(!user){
            throw new ApiError(401,"Invalid Refresh Token");
        }

        if(incomingRefreshToken!== user?.refreshToken){
            throw new ApiError(401,"Invalid Refresh Token");
        }

        const options={
            httpOnly:true,
            secure:process.env.NODE_ENV==='production',
        }

        const {accessToken,refreshToken:newRefreshToken}=await generateAccessAndRefreshToken(user._id);

        return res.status(200)
        .cookie('accessToken',accessToken,options)
        .cookie('refreshToken',newRefreshToken,options)
        .json(new ApiResponse(200,{accessToken,refreshToken:newRefreshToken},"access token refreshed successfully"));

    } catch (error) {
        throw new ApiError(500,"refreshing access token is failed!!!")
    }
})

const changeCurrentPassword=asyncHander(async (req,res)=>{
    const {oldPassword,newPassword}=req.body;

    const user=await User.findById(req.user?._id);

    const isPasswordValid=await user.isPasswordCorrect(oldPassword);

    if(!isPasswordValid){
        throw new ApiError(401,"password is incorrect");
    }

    user.password=newPassword;

    await user.save({validateBeforeSave:false});

    return res.status(200).json(new ApiResponse(200,{},"Password changed successfully"));
})

const getCurrentUser=asyncHander(async (req,res)=>{
    return res.status(200).json(new ApiResponse(200,req.user,"Current user"));
})

const updateAccountDetails=asyncHander(async (req,res)=>{
    const {fullName,email}=req.body;

    if(!fullName){
        throw new ApiError(400,"Fullname is required");
    }

    if(!email){
        throw new ApiError(400,"email is required");
    }

    const user=User.findByIdAndUpdate(req.user?._id,
        {
            fullName:fullName,
            email:email
        },
        {
            new:true
        }
    ).select("-password -refreshToken");

    return res.status(200).json(new ApiResponse(200,user,"Account details updated successfully"))
})

const updateUserAvatar=asyncHander(async (req,res)=>{
    const avatarLocalPath=req.file?.path;

    if(!avatarLocalPath){
        throw new ApiError(400,"File is required");
    }

    const avatar=await uploadOnCloudinary(avatarLocalPath);

    if(!avatar.url){
        throw new ApiError(500,"Something went wrong while uploading avatar");
    }
    const user=await User.findByIdAndUpdate(req.user?._id,
        {
            $set:{
                avatar:avatar.url
            }
        },
        {
            new:true
        }
    ).select("-password -refreshToken");

    return res.status(200).json(new ApiResponse(200,user,"Avatar updated successfully"))
})

const updateUserCoverImage=asyncHander(async (req,res)=>{
    const coverImageLocalPath=req.file?.path;

    if(!coverImageLocalPath){
        throw new ApiError(400,"File is required");
    }

    const coverImage=await uploadOnCloudinary(coverImageLocalPath);

    if(!coverImage.url){
        throw new ApiError(500,"Something went wrong while uploading avatar");
    }
    const user=await User.findByIdAndUpdate(req.user?._id,
        {
            $set:{
                coverImage:coverImage.url
            }
        },
        {
            new:true
        }
    ).select("-password -refreshToken");

    return res.status(200).json(new ApiResponse(200,user,"coverImage updated successfully"))
})

const getUserChannelProfile=asyncHander(async (req,res)=>{
    
})

const getWatchHistory=asyncHander(async (req,res)=>{

})

export {registerUser,loginUser,refreshAccessToken,logoutUser,changeCurrentPassword,getCurrentUser,updateAccountDetails,updateUserAvatar,updateUserCoverImage}