import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHander } from "../utils/asyncHandler.js";
import { Video } from "../models/video.models.js";
import { User } from "../models/user.models.js";
import mongoose from "mongoose";

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

const updateVideo=asyncHander(async (req,res)=>{

})

const deleteVideo=asyncHander(async (req,res)=>{

})

export {getVideoInfo,getVideoOwnerInfo};