const express = require("express")
const authController = require("../controllers/auth.controller.js")
const { authMiddleware } = require("../middlewares/auth.middleware.js")

const router = express.Router()

router.post("/send-otp",  authController.sendOTPController)   
router.post("/register",  authController.userRegisterController)
router.post("/login",     authController.userLoginController)
router.post("/logout",    authController.userLogoutController)
router.get("/profile",    authMiddleware, authController.userProfileController) // 

module.exports = router