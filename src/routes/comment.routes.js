import {Router} from 'express'
import { verifyJwt } from '../middlewares/auth.middlewares'
import { addVideoComment,addTweetComment,updateVideoComment,deleteComment,getTweetComments,getVideoComments } from '../controllers/comment.controllers'

const router=Router();

router.use(verifyJwt);

router.route("/v/:videoId").get(getVideoComments).post(addVideoComment)
router.route("/t/:tweetId").get(getTweetComments).post(addTweetComment)
router.route("/c/:commentId").patch(updateVideoComment).delete(deleteComment)

export default router;