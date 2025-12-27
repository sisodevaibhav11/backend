import dotenv from "dotenv"
import 'dotenv/config'
import cloudinary from 'cloudinary';
cloudinary.config();
dotenv.config({
    path: "./.env"
})

import app from './app.js'
import connectDB from "./db/index.js";



connectDB()
    .then(() => {
        app.listen(process.env.PORT || 8000, () => {
            console.log(`⚙️ Server is running at port : ${process.env.PORT}`);
        })
    })
    .catch((error) => {
        console.log("MONGO db connection failed !!! ", error);
    })










/*
import express from "express"
import 'dotenv/config'
import app from './app.js'
import connectDB from './db/index.js'
const app = express()
( async () => {
    try {
        await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
        app.on("errror", (error) => {
            console.log("ERRR: ", error);
            throw error
        })

        app.listen(process.env.PORT, () => {
            console.log(`App is listening on port ${process.env.PORT}`);
        })

    } catch (error) {
        console.error("ERROR: ", error)
        throw err
    }
})()

*/