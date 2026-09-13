import { asyncHandler } from "../utils/asyncHandler";
import { ApiError } from "../utils/ApiError";
import { ApiResponse } from "../utils/ApiResponse";
import { Playlist } from "../models/playlist.models";
import mongoose,{isValidObjectId} from "mongoose";

const createPlaylist=asyncHandler(async (req,res)=>{
    const {name,description}=req.body;
    
    if(!name || name.trim()===""){
        throw new ApiError(400,"Playlist name is required");
    }
    
    if(!description || description.trim()===""){
        throw new ApiError(400,"Playlist description is required");
    }

    const playlist=await Playlist.create({
        name:name.trim(),
        description:description.trim(),
        owner:req.user._id,
        videos:[]
    });

    return res.status(200).json(new ApiResponse(200,playlist,"Playlist created successfully"));
})

const updatePlaylist=asyncHandler(async (req,res)=>{
    const {playlistId}=req.params;
    const {name,description}=req.body;

    if(!isValidObjectId(playlistId)){
        throw new ApiError(404,"Invalid Playlist Id");
    }    

    if(!name || name.trim()===""){
        throw new ApiError(400,"Playlist name is required");
    }

    if(!description || description.trim()===""){
        throw new ApiError(400,"Playlist description is required");
    }

    const playlist=await Playlist.findById(playlistId);

    if(!playlist){
        throw new ApiError(404,"Playlist not found");
    }

    if(playlist.owner.toString()!==req.user._id.toString()){
        throw new ApiError(403,"You don't have permission to edit the playlist");
    }

    const updatedPlaylist=await Playlist.findByIdAndUpdate(
        playlistId,
        {
            $set:{
                name:name.trim(),
                description:description.trim()  
            }
        },
        {
            new:true
        }
    )

    return res.status(200).json(new ApiResponse(200,updatePlaylist,"Playlist updated successfully"))
})

const deletePlaylist=asyncHandler(async (req,res)=>{
    const {playlistId}=req.params;

    if(!isValidObjectId(playlistId)){
        throw new ApiError(400,"Invalid Playlist ID");
    }

    const playlist=await Playlist.findById(playlistId);

    if(!playlist){
        throw new ApiError(404,"Playlist not found");
    }

    if(playlist.owner.toString()!==req.user._id.toString()){
        throw new ApiError(403,"You don't have permission to delete this playlist");
    }

    await Playlist.findByIdAndDelete(
        playlistId
    );

    return res.status(200).json(new ApiResponse(200,{},"Playlist deleted successfully"));   
})

const removeVideoFromPlaylist=asyncHandler(async (req,res)=>{
    const {playlistId,videoId}=req.params;

    if(!isValidObjectId(playlistId) || !isValidObjectId(videoId)){
        throw new ApiError(400,"Invalid playlist or video Id");
    }

    const playlist=await Playlist.findById(playlistId);

    if(!playlist){
        throw new ApiError(404,"playlist not found");
    }

    if(playlist.owner.toString()!==req.user._id.toString()){
        throw new ApiError(403,"you don't have permission to modify this playlist");
    }

    const updatedPlaylist=await Playlist.findByIdAndDelete(
        playlistId,
        {
            $pull:{
                videos:videoId
            }
        },
        {
            new:true
        }
    )

    return res.status(200).json(new ApiResponse(200,updatedPlaylist,"video removed from playlist successfully"));   
})

const getUserPlaylists=asyncHandler(async (req,res)=>{
    const {userId}=req.params;

    if(!isValidObjectId(userId)){
        throw new ApiError(404,"Invalid user ID");
    }

    const playlists=await Playlist.aggregate([
        {
            $match:{
                owner:new mongoose.Types.ObjectId(userId)
            }
        },
        {
            $lookup:{
                from:'videos',
                localField:'videos',
                foreignField:'_id',
                as:'videos'
            }
        },
        {
            $addFields:{
                totalVideos:{
                    $size:"$videos"
                },
                totalViews:{
                    $sum:"$videos.views"
                }
            }
        },
        {
            $project:{
                name:1,
                description:1,
                totalVideos:1,
                totalViews:1,
                updatedAt:1
            }
        },
        {
            $sort:{
                updatedAt:-1
            }
        }
    ]);

    return res.status(200).json(new ApiResponse(200,playlists,"User playlists fetched successfully"));
})

const addVideoToPlaylist=asyncHandler(async (req,res)=>{
    const {playlistId,videoId}=req.params;

    if(!isValidObjectId(playlistId) || !isValidObjectId(videoId)){
        throw new ApiError(400,"Invalid playlist or video ID");
    }

    const playlist=await Playlist.findById(playlistId);

    if(!playlist){
        throw new ApiError(404,"Playlist not found");
    }

    if(playlist.owner.toString()!==req.user._id.toString()){
        throw new ApiError(403,"you don't have permission to edit the playlist");
    }

    const updatedPlaylist=await Playlist.findByIdAndUpdate(
        playlistId,
        {
            $set:{
                videos:videoId  
            }
        },
        {
            new:true
        }
    );

    return res.status(200).json(new ApiResponse(200,updatedPlaylist,'video added to playlist successfully'));
})

const getPlaylistById=asyncHandler(async (req,res)=>{
    const {playlistId}=req.params;

    if(!isValidObjectId(playlistId)){
        throw new ApiError(400,"Invalid Playlist ID");
    }

    const playlist=await Playlist.aggregate([
        {
            $match:{
                _id:new mongoose.Types.ObjectId(playlistId)
            }
        },
        {
            $lookup:{
                from:'videos',
                localField:'videos',
                foreignField:'_id',
                as:'videos',
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
                                        fullName:1,
                                        avatar:1
                                    }
                                }
                            ]
                        }
                    },
                    {
                        $unwind:'$owner'
                    }
                ]
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
                            fullName:1,
                            avatar:1
                        }
                    }
                ]
            }
        },
        {
            $unwind:'$ownerDetails'
        }
    ]);

    if(!playlist?.length){
        throw new ApiError(404,"Playlist not found");
    }

    return res.status(200).json(new ApiResponse(200,playlist[0],"Playlist fetched successfully"));
})

export {createPlaylist,updatePlaylist,deletePlaylist,removeVideoFromPlaylist,getPlaylistById,addVideoToPlaylist,getUserPlaylists};