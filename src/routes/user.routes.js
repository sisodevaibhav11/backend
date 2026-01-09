import { Router } from "express";
import { loginUser,logoutUser,registerUser } from "../controllers/user.controller.js";               // Importing the registerUser controller
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




export default router;               // Exporting the router 