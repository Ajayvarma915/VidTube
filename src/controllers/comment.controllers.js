import { ApiError } from "../utils/ApiError";
import { ApiResponse } from "../utils/ApiResponse";
import { asyncHandler } from "../utils/asyncHandler";
import { Comment } from "../models/comment.models";
import mongoose,{isValidObjectId} from "mongoose";

const addVideoComment=asyncHandler(async (req,res)=>{
    const {videoId}=req.params;
    const {content}=req.body;

    if(!content || content.trim==="") {
        throw new ApiError(400,"Content is required");
    }

    if(!videoId){
        throw new ApiError(400,"videoId is required to comment");
    }

    const comment=await Comment.create({
        content:content.trim(),
        video:videoId || null,
        owner: req.user?._id
    });

    return res.status(201).json(new ApiResponse(201,comment,"video comment added successfully"));

})

const addTweetComment=asyncHandler(async (req,res)=>{
    const {tweetId}=req.params;
    const {content}=req.body;

    if(!content || content.trim==="") {
        throw new ApiError(400,"Content is required");
    }

    if(!tweetId){
        throw new ApiError(400,"videoId is required to comment");
    }

    const comment=await Comment.create({
        content:content.trim(),
        tweet:tweetId || null,
        owner: req.user?._id
    });

    return res.status(201).json(new ApiResponse(201,comment,"tweet comment added successfully"));

})

const updateVideoComment=asyncHandler(async (req,res)=>{
    const {commentId}=req.params;
    const {content}=req.body;

    const comment=await Comment.findById(commentId);

    if(!comment){
        throw new ApiError(404,"Comment not found");
    }

    if(comment.owner.toString()!==req.user._id.toString()){
        throw new ApiError(403,"you do not have permission to edit this comment");
    }

    const updatedComment=await Comment.findByIdAndUpdate(
        commentId,
        {
            $set:{
                content:content.trim()
            }
        },
        {
            new:true
        }
    )

    return res.status(200).json(new ApiResponse(200,updatedComment,"comment updated successfully"));
})

const deleteComment=asyncHandler(async (req,res)=>{
    const {commentId}=req.params;
    
    const comment=await Comment.findById(commentId);

    if(!comment){
        throw new ApiError(404,"Invalid comment Id");
    }

    if(comment.owner.toString()!==req.user._id.toString()){
        throw new ApiError(403,"you don't have permission to delete this comment");
    }

    await Comment.findByIdAndDelete(commentId);

    return res.status(200).json(new ApiResponse(200,{},"comment deleted successfully"));    
})

const getVideoComments=asyncHandler(async (req,res)=>{
    const {videoId}=req.params;
    const {page=1,limit=10}=req.query;

    if(!isValidObjectId(videoId)){
        throw new ApiError(400,"Invalid video Id");
    }

    const allVideoComments=await Comment.aggregate([
        {
            $match:{
                video:new mongoose.Types.ObjectId(videoId)
            }
        },
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
                            fullName:1,
                            avatar:1
                        }
                    }
                ]
            }
        },
        {
            $unwind:"$owner"
        },
        {
            $sort:{
                createdAt:-1
            }
        }
    ]);


    const options={
        page:parseInt(page,10),
        limit:parseInt(page,10)
    }

    const comments=await Comment.aggregatePaginate(allVideoComments,options);
    return res.status(200).json(new ApiResponse(200,comments,"video commments fetched successfully"));
})

const getTweetComments=asyncHandler(async (req,res)=>{
    const {tweetId}=req.params;

    const {page=1,limit=10}=req.query;

    const alltweetedComments=await Comment.aggregate([
        {
            $match:{
                tweet:new mongoose.Types.ObjectId(tweetId)
            }
        },
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
                            fullName:1,
                            avatar:1
                        }
                    }
                ]
            }
        },
        {
            $unwind:"$owner"
        },
        {
            $sort:{
                createdAt:-1
            }
        }
    ]);

    const options={
        page:parseInt(page,10),
        limit:parseInt(limit,10)
    };

    const comments=await Comment.aggregatePaginate(alltweetedComments,options);

    return res.status(200).json(new ApiResponse(200,comments,"tweet comments fetched successfully"));
})


export {addTweetComment,addVideoComment,updateVideoComment,deleteComment,getVideoComments,getTweetComments}