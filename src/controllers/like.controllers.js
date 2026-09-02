import { Like } from "../models/like.models";
import { ApiResponse } from "../utils/ApiResponse";
import { asyncHandler } from "../utils/asyncHandler";
import { ApiError } from "../utils/ApiError";
import mongoose,{isValidObjectId} from "mongoose";

const toggleVideoLike=asyncHandler(async(req,res)=>{
    const {videoId}=req.params;

    if(!isValidObjectId(videoId)){
        throw new ApiError(400,"Invalid video ID");
    }

    const existingVideoLike=await Like.findOne({
        video:videoId,
        likedBy:req.user?._id
    });

    if(existingVideoLike){
        await Like.findByIdAndDelete(existingVideoLike._id);
        return res.status(200).json(new ApiResponse(200,{isLiked:false},"video unliked successfully"));
    }

    await Like.create({
        video:videoId,
        likedBy:req.user._id
    });

    return res.status(200).json(new ApiResponse(200,{isLiked:true},"video liked successfully"));
})

const toggleCommentLike=asyncHandler(async(req,res)=>{
    const {commentId}=req.params;

    if(!isValidObjectId(commentId)){
        throw new ApiError(400,"Invalid Comment ID");
    }

    const existingCommentLike=await Like.findOne({
        comment:commentId,
        likedBy:req.user._id
    });

    if(existingCommentLike){
        await Like.findByIdAndDelete(existingCommentLike._id);
        return res.status(200).json(new ApiResponse(200,{isLiked:false},"comment unliked successfully"));
    }

    await Like.create({
        comment:commentId,
        likedBy:req.user._id
    });

    return res.status(200).json(new ApiResponse(200,{isLiked:true},"comment liked successfully"));
})

const toggleTweetLike=asyncHandler(async(req,res)=>{
    const {tweetId}=req.params;

    if(!isValidObjectId(tweetId)){
        throw new ApiError(400,"Invalid Tweet ID");
    }

    const existingTweetLike=await Like.findOne({
        tweet:tweetId,
        likedBy:req.user._id
    });

    if(existingTweetLike){
        await Like.findByIdAndDelete(existingTweetLike._id);
        return res.status(200).json(new ApiResponse(200,{isLiked:false},"tweet unliked successfully"));
    }

    await Like.create({
        tweet:tweetId,
        likedBy:req.user._id
    });

    return res.status(200).json(new ApiResponse(200,{isLiked:true},"tweet liked successfully"));
})

const getAllLikedVideos=asyncHandler(async(req,res)=>{
    const likedVideos=await Like.aggregate([
        {
            $match:{
                likedBy:new mongoose.Types.ObjectId(req.user._id),
                video:{$exists:true,$ne:null}
            }
        },
        {
            $lookup:{
                from:'videos',
                localField:'video',
                foreignField:'_id',
                as:'likedVideo',
                pipeline:[
                    {
                        $lookup:{
                            from:'users',
                            localField:'owner',
                            foreignField:'_id',
                            as:'owner',
                            pipeline:[
                                {
                                    $project:{
                                        username:1,
                                        avatar:1,
                                        fullName:1
                                    }
                                }
                            ]
                        }
                    },
                    {
                        $unwind:"$owner"
                    }
                ]
            }
        },
        {
            $project:{
                _id:0,
                likedVideo:1
            }
        }
    ]);

    return res.status(200).json(new ApiResponse(200,likedVideos,"get all liked videos fetched successfully"));
})


export {toggleCommentLike,toggleTweetLike,toggleVideoLike,getAllLikedVideos};