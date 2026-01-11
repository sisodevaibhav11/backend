import mongoose, { isValidObjectId } from "mongoose"
import { Comment } from "../models/comment.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"

/**
 * GET ALL COMMENTS FOR A VIDEO
 */
const getVideoComments = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    const { page = 1, limit = 10 } = req.query

    // 1️⃣ Validate videoId
    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video ID")
    }

    const pageNum = Number(page)
    const limitNum = Number(limit)
    const skip = (pageNum - 1) * limitNum

    // 2️⃣ Fetch comments with pagination
    const comments = await Comment.find({ video: videoId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .populate("owner", "username avatar")

    const totalComments = await Comment.countDocuments({ video: videoId })

    // 3️⃣ Response
    return res.status(200).json(
        new ApiResponse(200, {
            comments,
            page: pageNum,
            limit: limitNum,
            totalPages: Math.ceil(totalComments / limitNum),
            totalComments
        }, "Comments fetched successfully")
    )
})

/**
 * ADD COMMENT TO A VIDEO
 */
const addComment = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    const { content } = req.body

    // 1️⃣ Validate videoId
    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video ID")
    }

    // 2️⃣ Validate content
    if (!content || content.trim() === "") {
        throw new ApiError(400, "Comment content is required")
    }

    // 3️⃣ Create comment
    const comment = await Comment.create({
        content,
        video: videoId,
        owner: req.user._id
    })

    // 4️⃣ Response
    return res.status(201).json(
        new ApiResponse(201, comment, "Comment added successfully")
    )
})

/**
 * UPDATE COMMENT
 */
const updateComment = asyncHandler(async (req, res) => {
    const { commentId } = req.params
    const { content } = req.body

    // 1️⃣ Validate commentId
    if (!isValidObjectId(commentId)) {
        throw new ApiError(400, "Invalid comment ID")
    }

    // 2️⃣ Validate content
    if (!content || content.trim() === "") {
        throw new ApiError(400, "Comment content is required")
    }

    // 3️⃣ Find comment
    const comment = await Comment.findById(commentId)
    if (!comment) {
        throw new ApiError(404, "Comment not found")
    }

    // 4️⃣ Authorization
    if (comment.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You are not allowed to update this comment")
    }

    // 5️⃣ Update comment
    comment.content = content
    await comment.save()

    // 6️⃣ Response
    return res.status(200).json(
        new ApiResponse(200, comment, "Comment updated successfully")
    )
})

/**
 * DELETE COMMENT
 */
const deleteComment = asyncHandler(async (req, res) => {
    const { commentId } = req.params

    // 1️⃣ Validate commentId
    if (!isValidObjectId(commentId)) {
        throw new ApiError(400, "Invalid comment ID")
    }

    // 2️⃣ Find comment
    const comment = await Comment.findById(commentId)
    if (!comment) {
        throw new ApiError(404, "Comment not found")
    }

    // 3️⃣ Authorization
    if (comment.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You are not allowed to delete this comment")
    }

    // 4️⃣ Delete comment
    await Comment.findByIdAndDelete(commentId)

    // 5️⃣ Response
    return res.status(200).json(
        new ApiResponse(200, null, "Comment deleted successfully")
    )
})

export {
    getVideoComments,
    addComment,
    updateComment,
    deleteComment
}
