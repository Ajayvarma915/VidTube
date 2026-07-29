import jwt from 'jsonwebtoken'
import { ApiError } from '../utils/ApiError'
import { ApiResponse } from '../utils/ApiResponse'
import { asyncHander } from '../utils/asyncHandler'
import { User } from '../models/user.models'

export const verifyJwt=asyncHander(async (req, _, next)=>{
    const token=req.cookies.accessToken || req.header("Authorization")?.replace("Bearer ","");

    if(!token){
        throw new ApiError(401,"unauthorized");
    }

    try {
        const decodedToken=jwt.verify(token,process.env.ACCESS_TOKEN_SECRET);
        const user=await User.findById(decodedToken?._id).select("-password -refreshToken");

        if(!user){
            throw new ApiError(401,"Unauthorized");
        }
        
        req.user=user;

        next();
    } catch (error) {
        throw new ApiError(401, "Unauthorized user || invalid access token");
    }  
})