import {Router} from 'express'
import { registerUser,logoutUser, loginUser, refreshAccessToken, changeCurrentPassword, getCurrentUser, getUserChannelProfile, updateAccountDetails, updateUserAvatar, updateUserCoverImage, getWatchHistory } from '../controllers/user.controllers.js'
import { upload } from '../middlewares/multer.middlewares.js';
import { verifyJwt } from '../middlewares/auth.middlewares.js';


const router=Router();

//unsecured routes
router.route('/register').post(
    upload.fields(
        [
            {name:'avatar',maxCount:1},
            {name:'coverImage',maxCount:1}
        ]
    ),
    registerUser
);

router.route('/refresh-token').post(refreshAccessToken)
router.route('/login').post(loginUser)

//secured routes
router.route('/logout').post(verifyJwt,logoutUser)
router.route('/change-password').post(verifyJwt,changeCurrentPassword)
router.route('/current-user').post(verifyJwt,getCurrentUser)
router.route('/c/:username').get(verifyJwt,getUserChannelProfile)
router.route('/update-account-details').patch(verifyJwt,updateAccountDetails)
router.route('/update-avatar').patch(verifyJwt,upload.single('avatar'),updateUserAvatar)
router.route('/update-coverImage').patch(verifyJwt,upload.single('coverImage'),updateUserCoverImage)
router.route('/watchHistory').get(verifyJwt,getWatchHistory)

export default router