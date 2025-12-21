import mongoose, { Schema } from 'mongoose';                //importing mongoose and Schema
import bcrypt from 'bcrypt';                                 //importing bcrypt for password hashing
import jwt from 'jsonwebtoken';                            //importing jsonwebtoken for token generation


const userSchema = new Schema({                               //defining user schema 
    username: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true,
        index: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true,
    },
    fullName: {
        type: String,
        required: true,
        trim: true,
        index: true
    },
    avatar: {
        type: String,
        default: null
    },
    password: {
        type: String,//cloudinary url
        required: true
    },
    coverImage: {
        type: String,//cloudinary url
    },
    watchHistory: [{
        type: [Schema.Types.ObjectId],
        ref: "Video"
    }],
    password: {
        type: String,
        required: [true, "Password is required"]
    },
    refreshToken: {
        type: String,
    }
}, {
    timestamps: true                                   //automatically manage createdAt and updatedAt fields
});

userSchema.pre("save", async function (next) {          ///middleware to hash password before saving
    if (!this.isModified("password")) {                //if password is not modified, skip hashing
        return next();
    }
    this.password = await bcrypt.hash(this.password, 10); //hashing password with salt rounds 10   ,hashing matlab tala uski chabi token hoti he then use krke usko access kr skte he
    next();
});

userSchema.methods.generateAccessToken = function () {   //method to generate JWT auth token
    const token = jwt.sign(
        { userId: this._id, username: this.username, email: this.email , fullName: this.fullName},
        process.env.ACCESS_TOKEN_SECRET,
        { expiresIn: process.env.ACCESS_TOKEN_EXPIRY }                             //token expires in 1 hour
    );
    return token;
};

userSchema.methods.generateRefreshToken = function () {  //method to generate JWT refresh token
    const token = jwt.sign(
        { userId: this._id, username: this.username },  
        process.env.REFRESH_TOKEN_SECRET,
        { expiresIn: process.env.REFRESH_TOKEN_EXPIRY }                            //refresh token expires in 7 days
    );
    return token;
};


userSchema.methods.isPasswordCorrect = async function (password) { //method to compare passwords
    return await bcrypt.compare(password, this.password); //comparing hashed passwords
};

export const User = mongoose.model("User", userSchema); //exporting user model