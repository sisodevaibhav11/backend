import mongoose, { isValidObjectId } from "mongoose"
import { Video } from "../models/video.model.js"
import { Subscription } from "../models/subscription.model.js"
import { Like } from "../models/like.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"

/**
 * GET CHANNEL STATS
 */
const getChannelStats = asyncHandler(async (req, res) => {
    const channelId = req.user._id

    // 1️⃣ Total videos uploaded by channel
    const totalVideos = await Video.countDocuments({ owner: channelId })

    // 2️⃣ Total video views
    const viewsResult = await Video.aggregate([
        { $match: { owner: channelId } },
        {
            $group: {
                _id: null,
                totalViews: { $sum: "$views" }
            }
        }
    ])
    const totalViews = viewsResult[0]?.totalViews || 0

    // 3️⃣ Total subscribers
    const totalSubscribers = await Subscription.countDocuments({
        channel: channelId
    })

    // 4️⃣ Total likes on channel videos
    const likesResult = await Like.aggregate([
        {
            $lookup: {
                from: "videos",
                localField: "video",
                foreignField: "_id",
                as: "videoData"
            }
        },
        { $unwind: "$videoData" },
        { $match: { "videoData.owner": channelId } },
        {
            $group: {
                _id: null,
                totalLikes: { $sum: 1 }
            }
        }
    ])
    const totalLikes = likesResult[0]?.totalLikes || 0

    // 5️⃣ Response
    return res.status(200).json(
        new ApiResponse(
            200,
            {
                totalVideos,
                totalViews,
                totalSubscribers,
                totalLikes
            },
            "Channel stats fetched successfully"
        )
    )
})

/**
 * GET CHANNEL VIDEOS
 */
const getChannelVideos = asyncHandler(async (req, res) => {
    const channelId = req.user._id

    // 1️⃣ Fetch videos uploaded by channel
    const videos = await Video.find({ owner: channelId })
        .sort({ createdAt: -1 })
        .populate("owner", "username avatar")

    // 2️⃣ Response
    return res.status(200).json(
        new ApiResponse(
            200,
            videos,
            "Channel videos fetched successfully"
        )
    )
})

export {
    getChannelStats,
    getChannelVideos
}
