import { asyncHandler } from "../utils/asyncHandler";
import { ApiResponse } from "../utils/ApiResponse";
import { ApiError } from "../utils/ApiError";
import { Tweet } from "../models/tweet.models";
import mongoose,{isValidObjectId} from "mongoose";

const createTweet=asyncHandler(async(req,res)=>{
    const {content}=req.body;

    if(!content || content.trim()===""){
        throw new ApiError(400,"content is required");
    }

    const tweet=await Tweet.create({
        content:content.trim(),
        owner:req.user._id
    });

    return res.status(200).json(new ApiResponse(200,tweet,"Tweet created successfully"));
})

const updateTweet=asyncHandler(async(req,res)=>{
    const {tweetId}=req.params;
    const {content}=req.body;

    if(!content || content.trim()===""){
        throw new ApiError(400,"content is required");
    }
    
    const tweet=Tweet.findById(tweetId);

    if(!tweet){
        throw new ApiError(404,"Tweet Id not found");
    }

    if(Tweet.owner.toString()!==req.user._id.toString()){
        throw new ApiError(403,"You do not have permission to edit this tweet");
    }

    const updatedTweet=await Tweet.findByIdAndUpdate(
        tweetId,
        {
            $set:{
                content:content.trim()
            }
        },
        {
            new:true    
        }
    );

    return res.status(200).json(new ApiResponse(200,updatedTweet,"Tweet updated successfully"));
})

const deleteTweet=asyncHandler(async(req,res)=>{
    const {tweetId}=req.params;

    const tweet=await Tweet.findById(tweetId);

    if(!tweet){
        throw new ApiError(404,"Tweet Id is invalid");
    }

    if(tweet.owner.toString()!==req.user._id.toString()){
        throw new ApiError(403,"You do not have permission to delete this tweet");
    }

    return res.status(200).json(new ApiResponse(200,{},"Tweet deleted successfully"));
})

const getUserTweets=asyncHandler(async(req,res)=>{
    const {userId}=req.params;

    if(!isValidObjectId(userId)){
        throw new ApiError(400,"Invalid User Id");
    }

    const gellAllUserTweets=await Tweet.aggregate([
        {
            $match:{
                owner:new mongoose.Types.ObjectId(userId)
            }
        },
        {
            $lookup:{
                from:'users',
                localField:'owner',
                foreignField:'_id',
                as:'ownerDetails',
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
            $unwind:'$ownerDetails'
        },
        {
            $sort:{
                createAt:-1
            }
        }
    ]);

    return res.status(200).json(new ApiResponse(200,gellAllUserTweets,"User Tweets fetched successfully"));
})

export {createTweet,updateTweet,deleteTweet,getUserTweets}
