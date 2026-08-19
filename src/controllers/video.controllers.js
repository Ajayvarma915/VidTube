import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHander } from "../utils/asyncHandler.js";
import { Video } from "../models/video.models.js";
import { User } from "../models/user.models.js";
import mongoose from "mongoose";
import { deleteFromCloudinary, uploadOnCloudinary } from "../utils/cloudinary.js";

const getVideoInfo=asyncHander(async (req,res)=>{
    const {videoId}=req.body || req.params;

    const video=await Video.findById(videoId);

    if(!video){
        throw new ApiError(404,"video doesn't exists with the video Id");
    }

    return res.status(200).json(new ApiResponse(200,video,"video info fetched successfully"));
})

const getVideoOwnerInfo=asyncHander(async (req,res)=>{
    const {videoId}=req.body || req.params;

    const video=await Video.aggregate([
        {
            $match:{
                _id: new mongoose.Types.ObjectId(videoId)
            }
        },
        {
            $lookup:{
                from:'users',
                localField:'owner',
                foreignField:'_id',
                as:'videoOwner'              
            }
        },
        {
            $unwind:"$videoOwner"
        },
        {
            $project:{ 
                _id:1,
                "videoOwner.username":1,
                "videoOwner.email":1,
                "videoOwner.fullName":1
            }
        }
    ])

    if(!video?.length){
        throw new ApiError(404,"video owner info not found")
    }

    return res.status(200).json(new ApiResponse(200,video[0],"Video owner info fetched successfully"))
})

const getAllVideos=asyncHander(async (req,res)=>{
    const {page=1,limit=10,query,sortBy='createdAt',sortType='desc',userId}=req.query;

    const matchConditions={
        isPublished:true
    }

    if(userId){
        matchConditions.owner=new mongoose.Types.ObjectId(userId);
    }

    if(query){
        matchConditions.$or=[
            {title:{ $regex: query, $options:1}},
            {description:{$regex: query, $options:1}}
        ];
    }

    const pipeline=[
        {
            $match:matchConditions
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
                            fullName:1,
                            username:1,
                            avatar:1
                        }
                    }
                ]
            }
        },
        {
            $addFields:{
                ownerDetails: {$first:'$ownerDetails'}
            }
        },
        {
            $sort:{
                [sortBy]:sortType==='desc'?-1:1
            }
        }
    ];

    const options= {
        page: parseInt(page,10),
        limit: parseInt(limit,10),
        customLabels:{
            totalDocs: 'totalVideos',
            docs: 'videos'
        }
    }

    const paginatedVideos= await Video.aggregatePaginate(Video.aggregate(pipeline),options);

    return res.status(200).json(new ApiResponse(200,paginatedVideos,"Videos fetched successfully"));
})

const publishVideo=asyncHander(async (req,res)=>{
    const {title,description}= req.body;

    if([title,description].some((field)=>field.trim()==="")){
        throw new ApiError(400,"Title and Description are required!!!");
    }

    const videoLocalPath=req.files?.videoFile?.[0]?.path;
    const thumbnailUpload=req.files?.thumbnail?.[0]?.path;

    if(!videoLocalPath){
        throw new ApiError(400,"Video file is required!!!");
    }

    if(!thumbnailUpload){
        throw new ApiError(400,"Thumbnail file is required!!!");
    }

    const videoUpload=await uploadOnCloudinary(videoLocalPath);
    const thumbnailUpload=await uploadOnCloudinary(thumbnailUpload);

    if(!videoUpload?.url){
        throw new ApiError(500,"Error while uploading video to cloudinary");
    }
    if(!thumbnailUpload?.url){
        throw new ApiError(500,"Error while uploading video to cloudinary");
    }

    const video=await Video.create({
        title,
        description,
        videoFile: videoUpload.url,
        thumbnail: thumbnailUpload.url,
        duration: videoUpload.duration,
        owner: req.user._id,
        isPublished:true
    });

    const uploadedVideo=await Video.findById(video._id);

    if(!uploadedVideo){
        throw new ApiError(500,"Something went wrong while saving the video to the database");
    }

    return res.status(201).json(new ApiResponse(200,uploadedVideo,"video published successfully"));
})
 
const updateVideo=asyncHander(async (req,res)=>{
    const {videoId}=req.params;
    const {title,description}=req.body;
    const thumbnailLocalPath=req.file?.path;

    if(!title && !description && !thumbnailLocalPath){
        throw new ApiError(400,"Please provide atleast one field to update");
    }

    const video= await Video.findById(videoId);

    if(!video){
        throw new ApiError(404,"Video not found");
    }

    if(video.owner.toString()!==req.user._id.toString()){
        throw new ApiError(403,"You do not have permission to update this video");
    }

    let thumbnailUrl=video.thumbnail;

    if(thumbnailLocalPath){
        const thumbnailUpload=await uploadOnCloudinary(thumbnailLocalPath);
        if(!thumbnailUpload?.url){
            throw new ApiError(500,"Error while uploading new thumbnail");
        }
        thumbnailUrl=thumbnailUpload.url;

        const oldThumbnailPublicId=video.thumbnail.split('/').pop().split('.')[0];

        await deleteFromCloudinary(oldThumbnailPublicId);

        const updatedVideo=await Video.findByIdAndUpdate(
            videoId,
            {
                $set:{
                    title: title || video.title,
                    description: description || video.description,
                    thumbnail: thumbnailUrl
                }
            },
            {
                new:true
            }
        );

        return res.status(200).json(new ApiResponse(200,updatedVideo,"Video updated successfully"));
    }
})

const deleteVideo=asyncHander(async (req,res)=>{
    
})

export {getVideoInfo,getVideoOwnerInfo};