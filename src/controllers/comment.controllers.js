import { ApiError } from "../utils/ApiError";
import { ApiResponse } from "../utils/ApiResponse";
import { asyncHandler } from "../utils/asyncHandler";
import { Comment } from "../models/comment.models";

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

    return res.status(200).json(new ApiResponse(200,updatedComment,"video comment updated successfully"));
})

const updatetweetComment=asyncHandler(async (req,res)=>{
    const {commentId}=req.params;
    const {content}=req.body;

    if(!content || content.trim()===""){
        throw new ApiError(404,"content is required");
    }

    const comment=await Comment.findById(commentId);

    if(!comment){
        throw new ApiError(404,"Invalid comment Id");
    }

    if(comment.owner.toString()!==req.user._id.toString()){
        throw new ApiError(403,"You do not have permission to edit this comment");
    }

    const updatedComment=await Comment.findByIdAndUpdate(
        commentId,
        {
            $set:{
                comment:comment.trim()
            }
        },
        {
            new:true
        }
    )

    return res.status(200).json(new ApiResponse(200,updatedComment,"tweet comment updated successfully"));
})

const deleteVideoComment=asyncHandler(async (req,res)=>{

})
const deleteTweetComment=asyncHandler(async (req,res)=>{

})

const getVideoComments=asyncHandler(async (req,res)=>{

})

const getTweetComments=asyncHandler(async (req,res)=>{

})


export {addTweetComment,addVideoComment,updateVideoComment,updatetweetComment,deleteComment,getVideoComments,getTweetComments}