import mongoose, { Schema } from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const likeSchema = new mongoose.Schema(
    {
        likedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },

        video: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Video",
            default: null,
        },
        tweet: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "tweet",
        },

        comment: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Comment",
            default: null,
        },
    },
    {
        timestamps: true,
    }
);

// Prevent duplicate likes
likeSchema.index(
    { likedBy: 1, video: 1, comment: 1 },
    { unique: true }
);

export const Like = mongoose.model("Like", likeSchema);