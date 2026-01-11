import mongoose, { isValidObjectId } from "mongoose"
import { User } from "../models/user.model.js"
import { Subscription } from "../models/subscription.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"

/**
 * TOGGLE SUBSCRIPTION (SUBSCRIBE / UNSUBSCRIBE)
 */
const toggleSubscription = asyncHandler(async (req, res) => {
    const { channelId } = req.params
    const subscriberId = req.user._id

    // 1️⃣ Validate channelId
    if (!isValidObjectId(channelId)) {
        throw new ApiError(400, "Invalid channel ID")
    }

    // 2️⃣ Prevent self-subscription
    if (channelId.toString() === subscriberId.toString()) {
        throw new ApiError(400, "You cannot subscribe to your own channel")
    }

    // 3️⃣ Check existing subscription
    const existingSubscription = await Subscription.findOne({
        channel: channelId,
        subscriber: subscriberId
    })

    // 4️⃣ If already subscribed → unsubscribe
    if (existingSubscription) {
        await existingSubscription.deleteOne()

        return res.status(200).json(
            new ApiResponse(200, { subscribed: false }, "Unsubscribed successfully")
        )
    }

    // 5️⃣ Else → subscribe
    await Subscription.create({
        channel: channelId,
        subscriber: subscriberId
    })

    return res.status(200).json(
        new ApiResponse(200, { subscribed: true }, "Subscribed successfully")
    )
})

/**
 * GET SUBSCRIBERS OF A CHANNEL
 */
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
    const { channelId } = req.params

    // 1️⃣ Validate channelId
    if (!isValidObjectId(channelId)) {
        throw new ApiError(400, "Invalid channel ID")
    }

    // 2️⃣ Fetch subscribers
    const subscribers = await Subscription.find({ channel: channelId })
        .populate("subscriber", "username avatar")
        .sort({ createdAt: -1 })

    return res.status(200).json(
        new ApiResponse(
            200,
            subscribers,
            "Channel subscribers fetched successfully"
        )
    )
})

/**
 * GET CHANNELS A USER HAS SUBSCRIBED TO
 */
const getSubscribedChannels = asyncHandler(async (req, res) => {
    const { subscriberId } = req.params

    // 1️⃣ Validate subscriberId
    if (!isValidObjectId(subscriberId)) {
        throw new ApiError(400, "Invalid subscriber ID")
    }

    // 2️⃣ Fetch subscribed channels
    const subscriptions = await Subscription.find({ subscriber: subscriberId })
        .populate("channel", "username avatar")
        .sort({ createdAt: -1 })

    return res.status(200).json(
        new ApiResponse(
            200,
            subscriptions,
            "Subscribed channels fetched successfully"
        )
    )
})

export {
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels
}
