const healthcheck = asyncHandler(async (req, res) => {
    return res.status(200).json(
        new ApiResponse(200, { status: "OK" }, "Server is healthy")
    )
})
