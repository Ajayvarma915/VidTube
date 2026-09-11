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

})

const getUserPlaylists=asyncHandler(async (req,res)=>{

})

const addVideoToPlaylist=asyncHandler(async (req,res)=>{

})

const getPlaylistById=asyncHandler(async (req,res)=>{

})

export {createPlaylist,updatePlaylist,deletePlaylist,removeVideoFromPlaylist,getPlaylistById,addVideoToPlaylist,getUserPlaylists};