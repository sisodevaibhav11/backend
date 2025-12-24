import { asyncHandler } from "../utils/asyncHandler.js";               // Importing the asyncHandler utility  


const registerUser = asyncHandler(async (req, res) => {               // Controller for user registration
  res.status(200).json({ message: "ok" });
});

export { registerUser };              // Exporting the registerUser controller


