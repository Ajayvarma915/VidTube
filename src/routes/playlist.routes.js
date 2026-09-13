import {Router} from 'express'
import { createPlaylist,updatePlaylist,deletePlaylist,removeVideoFromPlaylist,getPlaylistById,getUserPlaylists,addVideoToPlaylist } from "../controllers/playlist.controllers";
import { verifyJwt } from '../middlewares/auth.middlewares';

const router=Router();

router.use(verifyJwt)
router.route('/').get(createPlaylist)
router.route('/:playlistId').patch(updatePlaylist).delete(deletePlaylist).get(getPlaylistById)
router.route('/add/:videoId/:playlistId').patch(addVideoToPlaylist);
router.route('/remove/:videoId/:playlistId').patch(removeVideoFromPlaylist)

router.route('/user/:userId').get(getUserPlaylists)

export default router;
