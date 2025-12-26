import { asyncHandler } from "../utils/asyncHandler.js";               // Importing the asyncHandler utility  
import { ApiError } from "../utils/ApiError.js";               // Importing the ApiError utility for error handling
import { User } from "../models/user.model.js";               // Importing the User model for database operations
import { uploadOnCloudinary } from "../utils/cloudinary.js";               // Importing the Cloudinary upload utility
import { ApiResponse } from "../utils/ApiResponse.js";               // Importing the ApiResponse utility for standardized responses  


const registerUser = asyncHandler(async (req, res) => {               // Controller for user registration
  //get user detail from frontend
  //validarion -non empty
  //check user already exists username email
  //check for image and avatar
  //upload them to cloudinary avatar
  //create user object create entry in db
  //remove password and refresh token from user object
  //check for user creation
  //return response to frontend 


  //get user detail from frontend
  const { fullName, username, email, password } = req.body;         // Extracting user details from request body ye req body frontend se data lega pr abhi ke liye ye post man ke body se key value format json me se bhej rhe he
  console.log(fullName, username, email, password);

  //check for empty fields
  if ([fullName, username, email, password].some((field) => !field?.trim() === "")) {
    throw new ApiError(400, "All fields are required");               // Throwing an error if any field is empty
  }

  //check user already exists username email
  const existedUser = await User.findOne({               // Finding an existing user with the same username or email
    $or: [{ username }, { email }],
  })
  if (existedUser) {
    throw new ApiError(409, "User with given username or email already exists");               // Throwing an error if user already exists
  }

  const avatarLocaPath = req.files?.avatar[0]?.path;               // Getting the local path of the uploaded avatar image
  const coverImageLocalPath = req.files?.coverImage[0]?.path;               // Getting the local path of the uploaded cover image

  if (!avatarLocaPath) {
    throw new ApiError(400, "Avatar and Cover Image are required");               // Throwing an error if avatar or cover image is missing
  }

  //upload them to cloudinary avatar
  const avatar = await uploadOnCloudinary(avatarLocaPath);               // Uploading avatar to Cloudinary
  const coverImage = await uploadOnCloudinary(coverImageLocalPath);               // Uploading cover image to Cloudinary  
  if (!avatar) {
    throw new ApiError(400, "avatar file is required");               // Throwing an error if upload fails
  }

  //create user object create entry in db
  const newUser = await User.create({               // Creating a new user in the database
    fullName,
    avatar: avatar.url,
    coverImage: coverImage?.url || "",
    username: username.toLowerCase(),
    email,
    password,
  });


  //remove password and refresh token from user object
  const createdUser = await User.findById(newUser._id).select("-password -refreshToken");               // Fetching the created user without password and refresh token
  //check for user creation
  if (!createdUser) {
    throw new ApiError(500, "something went wrong while registering the user");               // Throwing an error if user creation fails
  }


  //return response to frontend 
  res.status(201).json(new ApiResponse(201, createdUser, "User registered successfully"));          // Sending a success response with the created user details

});
export { registerUser };              // Exporting the registerUser controller


