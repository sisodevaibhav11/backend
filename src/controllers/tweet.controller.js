import mongoose, { isValidObjectId } from "mongoose"
import { Tweet } from "../models/tweet.model.js"
import { User } from "../models/user.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"

const createTweet = asyncHandler(async (req, res) => {
    const { content } = req.body

    // 1️⃣ Validate input
    if (!content || content.trim() === "") {
        throw new ApiError(400, "Tweet content is required")
    }

    // 2️⃣ Create tweet
    const tweet = await Tweet.create({
        content,
        owner: req.user._id
    })

    // 3️⃣ Response
    return res.status(201).json(
        new ApiResponse(201, tweet, "Tweet created successfully")
    )
})

const getUserTweets = asyncHandler(async (req, res) => {
    const { userId } = req.params

    // 1️⃣ Validate userId
    if (!isValidObjectId(userId)) {
        throw new ApiError(400, "Invalid user ID")
    }

    // 2️⃣ Check if user exists
    const user = await User.findById(userId)
    if (!user) {
        throw new ApiError(404, "User not found")
    }

    // 3️⃣ Fetch tweets
    const tweets = await Tweet.find({ owner: userId })
        .sort({ createdAt: -1 })
        .populate("owner", "username avatar")

    // 4️⃣ Response
    return res.status(200).json(
        new ApiResponse(200, tweets, "User tweets fetched successfully")
    )
})

const updateTweet = asyncHandler(async (req, res) => {
    const { tweetId } = req.params
    const { content } = req.body

    // 1️⃣ Validate tweetId
    if (!isValidObjectId(tweetId)) {
        throw new ApiError(400, "Invalid tweet ID")
    }

    // 2️⃣ Validate content
    if (!content || content.trim() === "") {
        throw new ApiError(400, "Tweet content is required")
    }

    // 3️⃣ Find tweet
    const tweet = await Tweet.findById(tweetId)
    if (!tweet) {
        throw new ApiError(404, "Tweet not found")
    }

    // 4️⃣ Authorization
    if (tweet.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You are not allowed to update this tweet")
    }

    // 5️⃣ Update tweet
    tweet.content = content
    await tweet.save()

    // 6️⃣ Response
    return res.status(200).json(
        new ApiResponse(200, tweet, "Tweet updated successfully")
    )
})

const deleteTweet = asyncHandler(async (req, res) => {
    const { tweetId } = req.params

    // 1️⃣ Validate tweetId
    if (!isValidObjectId(tweetId)) {
        throw new ApiError(400, "Invalid tweet ID")
    }

    // 2️⃣ Find tweet
    const tweet = await Tweet.findById(tweetId)
    if (!tweet) {
        throw new ApiError(404, "Tweet not found")
    }

    // 3️⃣ Authorization
    if (tweet.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You are not allowed to delete this tweet")
    }

    // 4️⃣ Delete tweet
    await Tweet.findByIdAndDelete(tweetId)

    // 5️⃣ Response
    return res.status(200).json(
        new ApiResponse(200, null, "Tweet deleted successfully")
    )
})

export {
    createTweet,
    getUserTweets,
    updateTweet,
    deleteTweet
}
