
import { asyncHandler } from "../utils/asyncHandler.js";               // Importing the asyncHandler utility  
import { ApiError } from "../utils/ApiError.js";               // Importing the ApiError utility for error handling
import { User } from "../models/user.model.js";               // Importing the User model for database operations
import { uploadOnCloudinary } from "../utils/cloudinary.js";               // Importing the Cloudinary upload utility
import ApiResponse from "../utils/ApiResponse.js";               // Importing the ApiResponse utility for standardized responses  
import jwt from "jsonwebtoken";               // Importing the jsonwebtoken library for token generation and verification

// Function to generate access and refresh tokens
const generateAccessandRefreshTokens = async (userId) => {
  try {
    const user = await User.findById(userId);
    if (!user) {
      throw new ApiError(404, "User not found");
    }

    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
  } catch (error) {
    console.error("🔥 REAL TOKEN ERROR 🔥", error);
    throw error; // IMPORTANT: do NOT wrap it
  }
};



//Controller for user registration
const registerUser = asyncHandler(async (req, res, next) => {               // Controller for user registration
  //get user detail from frontend
  //validarion -non empty
  //check user already exists username email
  //check for image and avatar
  //upload them to cloudinary avatar
  //create user object create entry in db
  //remove password and refresh token from user object
  //check for user creation
  //return response to frontend 


  const { fullName, email, username, password } = req.body
  //console.log("email: ", email);

  if (
    [fullName, email, username, password].some((field) => field?.trim() === "")
  ) {
    throw new ApiError(400, "All fields are required")
  }

  const existedUser = await User.findOne({
    $or: [{ username }, { email }]
  });               // Checking if a user with the given username or email already exists

  if (existedUser) {
    throw new ApiError(409, "User with given username or email already exists");               // Throwing an error if user already exists
  }


  const avatarLocalPath = req.files?.avatar?.[0]?.path;               // Getting the local path of the uploaded avatar image
  // const coverImageLocalPath = req.files?.coverImage?.[0]?.path;               // Getting the local path of the uploaded cover image



  let coverImageLocalPath;
  if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
    coverImageLocalPath = req.files.coverImage[0].path;
  } else {
    coverImageLocalPath = null;
  }

  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar file is required");               // Throwing an error if avatar or cover image is missing
  }

  //upload them to cloudinary avatar
  const avatar = await uploadOnCloudinary(avatarLocalPath);               // Uploading avatar to Cloudinary
  const coverImage = await uploadOnCloudinary(coverImageLocalPath);               // Uploading cover image to Cloudinary  
  if (!avatar) {
    throw new ApiError(400, "avatar file is required");               // Throwing an error if upload fails
  }

  //create user object create entry in db
  const user = await User.create({               // Creating a new user in the database
    fullName,
    avatar: avatar.url,
    coverImage: coverImage?.url || "",
    username: username.toLowerCase(),
    email,
    password,
  });


  //remove password and refresh token from user object
  const createdUser = await User.findById(user._id).select("-password -refreshToken");               // Fetching the created user without password and refresh token
  //check for user creation
  if (!createdUser) {
    throw new ApiError(500, "something went wrong while registering the user");               // Throwing an error if user creation fails
  }


  //return response to frontend 
  return res.status(201).json(new ApiResponse(201, createdUser, "User registered successfully"));          // Sending a success response with the created user details

});


//Controller for user login
const loginUser = asyncHandler(async (req, res) => {
  //req body user
  //username or email
  //find user in db
  //password match
  //access token and refresh token
  //send cookies


  // Extracting the authenticated user from the request object
  let { email, username, password } = req.body;               // Extracting the authenticated user from the request object


  // Validating that either username or email is provided
  if (!(username?.trim() || email?.trim())) {
    throw new ApiError(400, "username or email is required");
  }

  if (!password) {
    throw new ApiError(400, "Password is required");
  }

  if (email) email = email.toLowerCase();
  if (username) username = username.toLowerCase();

  let user = await User.findOne({               // Finding the user in the database by username or email
    $or: [{ username }, { email }]
  });

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  const isPasswordValid = await user.isPasswordCorrect(password);               // Comparing the provided password with the stored password

  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid credentials");
  }


  const { accessToken, refreshToken } = await generateAccessandRefreshTokens(user._id);      // Generating access and refresh tokens for the authenticated user

  //send cookies
  const loggedInUser = await User.findById(user._id).select("-password -refreshToken");  // Fetching the logged-in user without password and refresh token

  // Setting the refresh token as an HTTP-only, secure cookie
  const options = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict"
  }

  return res.
    status(200).
    cookie("accessToken", accessToken, options).
    cookie("refreshToken", refreshToken, options).
    json(new ApiResponse(200, { user: loggedInUser, accessToken, refreshToken }, "User logged in successfully"));


});


//controller for logout user
const logoutUser = asyncHandler(async (req, res) => {
  // OPTIONAL: try to clear refreshToken only if user exists
  if (req.user?._id) {
    await User.findByIdAndUpdate(
      req.user._id,
      { $unset: { refreshToken: 1 } },
      { new: true }
    );
  }

  //clear cookies
  const options = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict"
  }
  return res.
    status(200).
    clearCookie("accessToken", options).
    clearCookie("refreshToken", options).
    json(new ApiResponse(200, {}, "User logged out successfully"));               // Sending a success response for logout  
});


const refreshAccessToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken;
  if (!incomingRefreshToken) {
    throw new ApiError(401, "Refresh token not found, please login again");
  }



  try {
    //verify token
    const decodedToken = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );               // Verifying the incoming refresh token


    //find user in db
    const user = await User.findById(decodedToken?._id);
    if (!user) {
      throw new ApiError(404, "invalid resfresh token, user not found");
    }

    //match refresh token
    if (user?.refreshToken !== incomingRefreshToken) {
      throw new ApiError(401, "refresh token mismatch, please login again");
    }

    const options = {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict"
    }

    const { accessToken, newrefreshToken } = await generateAccessandRefreshTokens(user._id);      // Generating new access and refresh tokens

    return res.
      status(200).
      cookie("accessToken", accessToken, options).
      cookie("refreshToken", newrefreshToken, options).
      json(new ApiResponse(200, { accessToken, refreshToken: newrefreshToken }, "Access token refreshed successfully"));

  } catch (error) {
    throw new ApiError(401, error?.message || "Invalid refresh token, please login again");
  }
});

export {
  registerUser, loginUser, logoutUser, refreshAccessToken
};              // Exporting the registerUser controller


