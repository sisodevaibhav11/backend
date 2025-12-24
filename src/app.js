import express, { urlencoded } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

const app = express();
app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true             // Allow requests from this origin
}));

app.use(express.json({limit: "16kb"}));              // Middleware for parsing JSON request bodies
app.use(express.urlencoded({ extended: true, limit: "16kb" }));      // Middleware for parsing URL-encoded data
app.use(express.static("public"));                       // Serving static files from the "public" directory
app.use(cookieParser());                                  // Middleware for parsing cookies 



//routes import and usage would go here
import userRouter from "./routes/user.routes.js";              
 

//routes declaration
app.use("/api/v1/users", userRouter);    // Using userRouter for /api/v1/users routes


export default app;


