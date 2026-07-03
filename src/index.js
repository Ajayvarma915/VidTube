import { Router } from "express";
import { app } from "./app.js";
import dotenv from 'dotenv';
import mongoose from 'mongoose'
import connectDB
 from "./db/index.js";
dotenv.config({
    path:'./.env'
})
let port=process.env.port || 8000

connectDB()
.then(()=>{
    app.listen(port,()=>{
        console.log(`Server is running at port: ${port}`);
    })
})
.catch((err)=>{
    console.log("MongoDB connection error. ",err);
})