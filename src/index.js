import { Router } from "express";
import { app } from "./app.js";
import dotenv from 'dotenv';
import mongoose from 'mongoose'

dotenv.config({
    path:'./.env'
})
let port=process.env.port || 8000

app.listen(port,()=>{
    console.log(`server is running on port ${process.env.port}`)
})