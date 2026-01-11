
import { asyncHandler } from "../utils/asyncHandler.js";               // Importing the asyncHandler utility  
import { ApiError } from "../utils/ApiError.js";               // Importing the ApiError utility for error handling
import { User } from "../models/user.model.js";               // Importing the User model for database operations
import { uploadOnCloudinary } from "../utils/cloudinary.js";               // Importing the Cloudinary upload utility
import {ApiResponse} from "../utils/ApiResponse.js";               // Importing the ApiResponse utility for standardized responses  
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

//controller for refresh access token
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

    const { accessToken, refreshToken } = await generateAccessandRefreshTokens(user._id);      // Generating new access and refresh tokens

    return res.
      status(200).
      cookie("accessToken", accessToken, options).
      cookie("refreshToken", refreshToken, options).
      json(new ApiResponse(200, { accessToken, refreshToken }, "Access token refreshed successfully"));

  } catch (error) {
    throw new ApiError(401, error?.message || "Invalid refresh token, please login again");
  }
});

//change current password
const changeCurrentPassword = asyncHandler(async (req, res) => {


  const { oldpassword, newpassword } = req.body;  // Extracting old and new passwords from the request body
  
  const user = await User.findById(req.user?._id);   // Finding the user in the database by their ID

  if (!user) {
    throw new ApiError(400, "User not authenticated");
  }

  const isPasswordCorrect = await user.isPasswordCorrect(oldpassword);
  if (!isPasswordCorrect) {
    throw new ApiError(401, "Invalid old password");
  }

  user.password = newpassword;
  await user.save({ validateBeforeSave: false });

  return res.
    status(200).
    json(new ApiResponse(200, {}, "Password changed successfully"));
});

//get current user
const getCurrentUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user?._id);
  if (!user) {
    throw new ApiError(404, "User not found");
  }
  return res.
    status(200).
    json(new ApiResponse(200, user, "Current user fetched successfully"));
});


//update account details
const updateAccountDetails = asyncHandler(async (req, res) => {
  //to be implemented

  const { fullName, email } = req.body;

  if (!fullName || !email) {
    throw new ApiError(400, "fullName and email are required");
  }
  const updatedUser = await User.findByIdAndUpdate(req.user?._id,
    { $set: { fullName, email } },
    { new: true, runValidators: true }
  ).select("-password");  //select to exclude password field

  return res.
    status(200).
    json(new ApiResponse(200, updatedUser, "User details updated successfully"));
});

//update user avatar 
const updateUserAvatar = asyncHandler(async (req, res) => {
  const avatarLocalPath = req.file?.path;

  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar file is required");
  }

  const avatar = await uploadOnCloudinary(avatarLocalPath);
  if (!avatar.url) {
    throw new ApiError(500, "Error uploading avatar");
  }

  const updatedUser = await User.findByIdAndUpdate(
    req.user?._id,
    { $set: { avatar: avatar.url } },
    { new: true }
  ).select("-password");


  return res.
    status(200).
    json(new ApiResponse(200, updatedUser, "User avatar updated successfully"));
}
);

//update cover image
const updateUserCoverImage = asyncHandler(async (req, res) => {
  const coverImageLocalPath = req.file?.path;
  if (!coverImageLocalPath) {
    throw new ApiError(400, "Cover image file is required");
  }
  const coverImage = await uploadOnCloudinary(coverImageLocalPath);
  if (!coverImage.url) {
    throw new ApiError(500, "Error uploading cover image");
  }
  const updatedUser = await User.findByIdAndUpdate(
    req.user?._id,
    { $set: { coverImage: coverImage.url } },
    { new: true }
  ).select("-password");


  return res.
    status(200).
    json(new ApiResponse(200, updatedUser, "User cover image updated successfully"));
}
);

//get user channel profile
const getUserChannelProfile = asyncHandler (async(req, res) => {
  const { username } = req.params;

  if (!username) {
    throw new ApiError(400, "username is missing");
  }


  const channel = await User.aggregate([
    {
      $match: {
        username: username?.toLowerCase()
      }
    },
    {
      $lookup: {
        from: "subscriptions",
        localField: "_id",
        foreignField: "channel",
        as: "subscribers"
      }
    },
    {
      $lookup: {
        from: "subscriptions",
        localField: "_id",
        foreignField: "subscriber",
        as: "subscribedTo"
      }
    },
    {
      $addFields: {
        subscribersCount: { $size: "$subscribers" },
        subscribedToCount: { $size: "$subscribedTo" },
        isSubscribed: {
          $cond: {
            if: { $in: [req.user?._id, "$subscribers.subscriber"] },
            then: true,
            else: false
          }
        }
      }
    },
    {
      $project: {
        fullName: 1,
        username: 1,
        avatar: 1,
        subscribersCount: 1,
        subscribedToCount: 1,
        isSubscribed: 1,
        email: 1,
        coverImage: 1
      }
    }
  ]);

  console.log(channel);

  if (!channel?.length) {
    throw new ApiError(404, "channel does not exist");
  }

  return res
    .status(200)
    .json(200, channel[0], "user channel fetched succesfully");
});

//get watch history
const getWatchHistory = asyncHandler(async (req, res) => {
  const userId = req.user._id;                  //here id automatically convert  <objectId("achsdjsd")>

  const history = await User.aggregate([
    {
      $match: { _id: userId }                   //here object id in form of <objectId("achsdjsd")>
    },
    {
      $lookup: {
        from: "videos",
        localField: "watchHistory",
        foreignField: "_id",
        as: "watchHistory"
      }
    },
    {
      $unwind: "$watchHistory"
    },
    {
      $lookup: {
        from: "users",
        localField: "watchHistory.owner",
        foreignField: "_id",
        as: "watchHistory.owner"
      }
    },
    {
      $unwind: "$watchHistory.owner"
    },
    {
      $sort: {
        "watchHistory.createdAt": -1
      }
    },
    {
      $project: {
        _id: 0,
        watchHistory: {
          _id: 1,
          title: 1,
          thumbnail: 1,
          duration: 1,
          views: 1,
          createdAt: 1,
          owner: {
            username: "$watchHistory.owner.username",
            avatar: "$watchHistory.owner.avatar"
          }
        }
      }
    }
  ]);

  res.status(200).json(history);
});

export {
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  changeCurrentPassword,
  getCurrentUser,
  updateAccountDetails,
  updateUserAvatar,
  updateUserCoverImage,
  getUserChannelProfile,
  getWatchHistory
};


