import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHander } from "../utils/asyncHandler.js";

const healthCheck=asyncHander(async (req,res)=>{
    res.status(200).json(new ApiResponse(200,"ok","HealthCheck is good."))
})

export {healthCheck};