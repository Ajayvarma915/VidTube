import { verifyJwt } from "../middlewares/auth.middlewares.js";
import { getVideoInfo,getVideoOwnerInfo,getAllVideos,publishVideo,updateVideo,deleteVideo } from "../controllers/video.controllers.js";
import {Router} from 'express'
import { upload } from "../middlewares/multer.middlewares.js";

const router=Router();

router.use(verifyJwt);

router.route('/').get(getAllVideos).post(upload.fields([
    { name:'videoFile',maxCount:1},
    { name:'thumbnail',maxCount:1},
]),publishVideo);

router.route('/:videoId').get(getVideoInfo).delete(deleteVideo).patch(upload.single('thumbnail'),updateVideo);

router.route('/owner/:videoId').get(getVideoOwnerInfo);

export default router;