import { Router } from "express";
import { registerUser } from "../controllers/user.controller.js";               // Importing the registerUser controller

const router = Router();

router.post("/register", registerUser);                      // Handling POST requests with registerUser controller 


    export default router;               // Exporting the router 