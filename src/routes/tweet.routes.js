import { verifyJwt } from "../middlewares/auth.middlewares";
import {Router} from 'express'
import { createTweet,updateTweet,deleteTweet,getUserTweets } from "../controllers/tweet.controllers";

const router=Router();
router.use(verifyJwt);

router.route('/').post(createTweet);
router.route('/:tweetId').patch(updateTweet).delete(deleteTweet);
router.route('/user/:userId').get(getUserTweets)


export default router;