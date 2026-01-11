import mongoose, { isValidObjectId } from "mongoose"
import { Video } from "../models/video.model.js"
import { User } from "../models/user.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js"


//get allvideos
const getAllVideos = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query

    const pageNum = Number(page)
    const limitNum = Number(limit)
    const skip = (pageNum - 1) * limitNum

    const match = {}

    // only published videos
    match.isPublished = true

    // search by title or description
    if (query) {
        match.$or = [
            { title: { $regex: query, $options: "i" } },
            { description: { $regex: query, $options: "i" } }
        ]
    }

    // filter by user
    if (userId && isValidObjectId(userId)) {
        match.owner = new mongoose.Types.ObjectId(userId)
    }

    // sorting
    const sort = {
        [sortBy || "createdAt"]: sortType === "asc" ? 1 : -1
    }

    const videos = await Video.find(match)
        .sort(sort)
        .skip(skip)
        .limit(limitNum)
        .populate("owner", "username avatar")

    const totalVideos = await Video.countDocuments(match)

    return res.status(200).json(
        new ApiResponse(200, {
            videos,
            page: pageNum,
            limit: limitNum,
            totalPages: Math.ceil(totalVideos / limitNum),
            totalVideos
        }, "Videos fetched successfully")
    )
})


//publish videos
const publishAVideo = asyncHandler(async (req, res) => {
    const { title, description } = req.body

    // 1️⃣ Validate input
    if (!title) {
        throw new ApiError(400, "Title is required")
    }

    // 2️⃣ Get video file
    const videoLocalPath = req.files?.video?.[0]?.path
    if (!videoLocalPath) {
        throw new ApiError(400, "Video file is required")
    }

    // 3️⃣ Get thumbnail (optional)
    const thumbnailLocalPath = req.files?.thumbnail?.[0]?.path

    // 4️⃣ Upload video to Cloudinary
    const videoUpload = await uploadOnCloudinary(videoLocalPath)
    if (!videoUpload?.url) {
        throw new ApiError(500, "Failed to upload video")
    }

    // 5️⃣ Upload thumbnail if exists
    let thumbnailUpload = null
    if (thumbnailLocalPath) {
        thumbnailUpload = await uploadOnCloudinary(thumbnailLocalPath)
    }

    // 6️⃣ Create video document
    const video = await Video.create({
        title,
        description,
        videoFile: {
            url: videoUpload.url,
            public_id: videoUpload.public_id
        },
        thumbnail: thumbnailUpload
            ? {
                url: thumbnailUpload.url,
                public_id: thumbnailUpload.public_id
              }
            : undefined,
        duration: videoUpload.duration,
        owner: req.user._id,
        isPublished: true
    })

    // 7️⃣ Response
    return res.status(201).json(
        new ApiResponse(201, video, "Video published successfully")
    )
})

//get video by id
const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params

    // 1️⃣ Validate videoId
    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video ID")
    }

    // 2️⃣ Fetch video and populate owner details
    const video = await Video.findById(videoId)
        .populate("owner", "username avatar")

    // 3️⃣ If video not found
    if (!video) {
        throw new ApiError(404, "Video not found")
    }

    // 4️⃣ Check publish status (private video access)
    if (!video.isPublished) {
        if (!req.user || video.owner._id.toString() !== req.user._id.toString()) {
            throw new ApiError(403, "You are not allowed to view this video")
        }
    }

    // 5️⃣ Increment views
    video.views += 1
    await video.save({ validateBeforeSave: false })

    // 6️⃣ Send response
    return res.status(200).json(
        new ApiResponse(200, video, "Video fetched successfully")
    )
})

//update video
const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    const { title, description } = req.body

    // 1️⃣ Validate videoId
    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video ID")
    }

    // 2️⃣ Find video
    const video = await Video.findById(videoId)
    if (!video) {
        throw new ApiError(404, "Video not found")
    }

    // 3️⃣ Authorization check
    if (video.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You are not allowed to update this video")
    }

    // 4️⃣ Update title & description (if provided)
    if (title) video.title = title
    if (description) video.description = description

    // 5️⃣ Update thumbnail (if provided)
    const thumbnailLocalPath = req.files?.thumbnail?.[0]?.path
    if (thumbnailLocalPath) {
        const thumbnailUpload = await uploadOnCloudinary(thumbnailLocalPath)
        if (!thumbnailUpload?.url) {
            throw new ApiError(500, "Thumbnail upload failed")
        }

        video.thumbnail = {
            url: thumbnailUpload.url,
            public_id: thumbnailUpload.public_id
        }
    }

    // 6️⃣ Save updated video
    await video.save()

    // 7️⃣ Response
    return res.status(200).json(
        new ApiResponse(200, video, "Video updated successfully")
    )
})


const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params

    // 1️⃣ Validate videoId
    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video ID")
    }

    // 2️⃣ Find video
    const video = await Video.findById(videoId)
    if (!video) {
        throw new ApiError(404, "Video not found")
    }

    // 3️⃣ Authorization check
    if (video.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You are not allowed to delete this video")
    }

    // 4️⃣ Delete video document
    await Video.findByIdAndDelete(videoId)

    // 5️⃣ Response
    return res.status(200).json(
        new ApiResponse(200, null, "Video deleted successfully")
    )
})


const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params

    // 1️⃣ Validate videoId
    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video ID")
    }

    // 2️⃣ Find video
    const video = await Video.findById(videoId)
    if (!video) {
        throw new ApiError(404, "Video not found")
    }

    // 3️⃣ Authorization check
    if (video.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You are not allowed to change publish status")
    }

    // 4️⃣ Toggle publish status
    video.isPublished = !video.isPublished

    // 5️⃣ Save changes
    await video.save()

    // 6️⃣ Response
    return res.status(200).json(
        new ApiResponse(
            200,
            { isPublished: video.isPublished },
            "Publish status updated successfully"
        )
    )
})


export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus
}