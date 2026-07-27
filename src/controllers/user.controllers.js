import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHander } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.models.js";
import { uploadOnCloudinary,deleteFromCloudinary } from "../utils/cloudinary.js";

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

export {registerUser,loginUser}