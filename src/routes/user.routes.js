import { Router } from "express";
import { loginUser,logoutUser,registerUser,refreshAccessToken, changeCurrentPassword, getCurrentUser, updateAccountDetails, updateUserCoverImage, updateUserAvatar, getUserChannelProfile, getWatchHistory } from "../controllers/user.controller.js";               // Importing the registerUser controller
import {upload} from   "../middlewares/multer.middleware.js";      // Importing the multer middleware for file uploads
import  {verifyJWT}  from "../middlewares/auth.middleware.js";
const router = Router();

// Route for user registration
router.route("/register").post(
    upload.fields([
        { name: 'avatar', maxCount: 1 },          // Field for profile picture,
        { name: 'coverImage', maxCount: 1 }                 // Field for cover image
    ]),
     registerUser);                      // Handling POST requests with registerUser controller 


// Route for user login
router.route("/login").post(loginUser);               // Handling POST requests with loginUser controller


//secure routes can be added here
router.route("/logout").post(logoutUser);               // Handling POST requests with logoutUser controller 

// Route for refreshing access token
router.route("/refresh-token").post(refreshAccessToken);               // Handling POST requests with logoutUser controller

//change password
router.route("/change-password").post(verifyJWT,changeCurrentPassword);

router.route("/current-user").get(verifyJWT,getCurrentUser);

router.route("/update-account").patch(verifyJWT,updateAccountDetails);

router.route("/avatar").patch(verifyJWT,upload.single("avatar"),updateUserAvatar);

router.route("/cover-image").patch(verifyJWT,upload.single("coverImage"),updateUserCoverImage);

router.route("/c/:username").get(verifyJWT,getUserChannelProfile);

router.route("/history").post(verifyJWT,getWatchHistory);

export default router;               // Exporting the router 