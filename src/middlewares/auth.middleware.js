import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";                  // Importing the ApiError class for custom error handling
import { asyncHandler } from "../utils/asyncHandler.js";            // Importing the asyncHandler utility for handling asynchronous errors
import jwt from "jsonwebtoken";                                 // Importing the jsonwebtoken library for JWT operations


//this middlware will verify jwt token from request header or cookies hume iski jarurat logout karne ke liye padegi to check krne ke liye ki user logged in hai ya nhi 
//jane se pehle mujse milke jana called middleware(before loggedout)
const verifyJWT = asyncHandler(async (req, res, next) => {
    try {
        const token = req.cookies?.accessToken || 
        req.header("Authorization")?.replace("Bearer ", "");                                       // Extracting the token from the Authorization header if present;
        if (!token) {
            throw new ApiError(401, "Unauthorized request- Access Token missing");
        }

        const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

        const user = await User.findById(decodedToken?._id).select("-password -refreshToken");                // Finding the user in the database by ID from the decoded token
        if (!user) {
            //discuss about frontend
            throw new ApiError(401, "Invalid Access Token - user not found");
        }
        req.user = user;                // Attaching the authenticated user to the request object for further use in the request lifecycle
        next();                     // Proceeding to the next middleware or route handler 
    }
    catch (error) {
        throw new ApiError(401, error?.message||"Invalid or expired Access Token");
    }


});    

export { verifyJWT };                // Exporting the verifyJWT middleware for use in other parts of the application