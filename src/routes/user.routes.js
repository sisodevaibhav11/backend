import { Router } from "express";
import { registerUser } from "../controllers/user.controller.js";               // Importing the registerUser controller
import {upload} from   "../middlewares/multer.middleware.js";      // Importing the multer middleware for file uploads
const router = Router();

router.route("/register").post(
    upload.fields([
        { name: 'avatar', maxCount: 1 },          // Field for profile picture,
        { name: 'coverImage', maxCount: 1 }                 // Field for cover image
    ]),
     registerUser);                      // Handling POST requests with registerUser controller 


    export default router;               // Exporting the router 