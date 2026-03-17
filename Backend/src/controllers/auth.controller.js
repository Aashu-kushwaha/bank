/*
User Registration — with OTP verification
User Login — direct (no OTP)
JWT Token Generation
Logout
Profile Fetch
*/
const userModel = require("../models/user.model.js")
const accountModel = require("../models/account.model.js")
const otpModel = require("../models/otp.model.js")
const jwt = require("jsonwebtoken")
const emailservice = require("../services/email.service.js")
const tokenBlackListModel = require("../models/blackList.model.js")
const crypto = require("crypto")

/**
 * Step 1 — Send OTP before registration
 * POST /api/auth/send-otp
 */
async function sendOTPController(req, res) {
  try {
    const { email } = req.body

    if (!email) {
      return res.status(400).json({ message: "Email is required." })
    }

    // Check if email already registered
    const isExists = await userModel.findOne({ email })
    if (isExists) {
      return res.status(422).json({
        message: "User already exists with this email."
      })
    }

    // Generate 6 digit OTP
    const otp = crypto.randomInt(100000, 999999).toString()

    // Delete any existing OTP for this email
    await otpModel.deleteMany({ email })

    // Save OTP with 5 minute expiry
    await otpModel.create({
      email,
      otp,
      expiresAt: new Date(Date.now() + 5 * 60 * 1000)
    })

    // Send OTP email
    await emailservice.sendOTPEmail(email, otp)

    return res.status(200).json({
      message: "OTP sent to your email. Valid for 5 minutes.",
      email
    })

  } catch (err) {
    console.error("Send OTP error:", err)
    return res.status(500).json({ message: "Internal server error." })
  }
}

/**
 * Step 2 — Verify OTP then Register
 * POST /api/auth/register
 */
async function userRegisterController(req, res) {
  try {
    const { email, password, name, otp } = req.body

    if (!email || !password || !name || !otp) {
      return res.status(400).json({ message: "All fields including OTP are required." })
    }

    // Check if already registered
    const isExists = await userModel.findOne({ email })
    if (isExists) {
      return res.status(422).json({
        message: "User already exists with this email."
      })
    }

    // Verify OTP
    const otpRecord = await otpModel.findOne({ email })

    if (!otpRecord) {
      return res.status(401).json({
        message: "OTP expired or not found. Please request a new one."
      })
    }

    if (otpRecord.otp !== otp) {
      return res.status(401).json({ message: "Invalid OTP." })
    }

    if (otpRecord.expiresAt < new Date()) {
      await otpModel.deleteMany({ email })
      return res.status(401).json({
        message: "OTP has expired. Please request a new one."
      })
    }

    // OTP valid — delete it
    await otpModel.deleteMany({ email })

    // Create user
    const user = await userModel.create({ email, password, name })

    // Auto-create account
    await accountModel.findOneAndUpdate(
      { user: user._id },
      { user: user._id },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    )

    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: "3d" }
    )

    res.cookie("token", token)

    res.status(201).json({
      user: { id: user._id, email: user.email, name: user.name },
      token
    })

    await emailservice.sendRegistrationEmail(user.email, user.name)

  } catch (err) {
    console.error("Register error:", err)
    return res.status(500).json({ message: "Internal server error." })
  }
}

/**
 * User Login — direct, no OTP
 * POST /api/auth/login
 */
async function userLoginController(req, res) {
  try {
    const { email, password } = req.body

    const user = await userModel.findOne({ email }).select("+password")
    if (!user) {
      return res.status(401).json({ message: "Email or password is invalid." })
    }

    const isValidPassword = await user.comparePassword(password)
    if (!isValidPassword) {
      return res.status(401).json({ message: "Email or password is invalid." })
    }

    // Auto-create account if not exists
    await accountModel.findOneAndUpdate(
      { user: user._id },
      { user: user._id },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    )

    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: "3d" }
    )

    res.cookie("token", token)

    res.status(200).json({
      user: { id: user._id, email: user.email, name: user.name },
      token
    })

    await emailservice.sendLoginEmail(user.email, user.name)

  } catch (err) {
    console.error("Login error:", err)
    return res.status(500).json({ message: "Internal server error." })
  }
}

/**
 * User Logout
 * POST /api/auth/logout
 */
async function userLogoutController(req, res) {
  try {
    const token = req.cookies.token || req.headers.authorization?.split(" ")[1]

    if (!token) {
      return res.status(400).json({ message: "No token found." })
    }

    const alreadyBlacklisted = await tokenBlackListModel.findOne({ token })
    if (alreadyBlacklisted) {
      res.clearCookie("token")
      return res.status(200).json({ message: "User logged out successfully." })
    }

    await tokenBlackListModel.create({ token })
    res.clearCookie("token")

    return res.status(200).json({ message: "User logged out successfully." })

  } catch (err) {
    console.error("Logout error:", err)
    return res.status(500).json({ message: "Internal server error." })
  }
}

/**
 * User Profile
 * GET /api/auth/profile
 */
async function userProfileController(req, res) {
  try {
    const user = await userModel.findById(req.user._id)
    if (!user) {
      return res.status(404).json({ message: "User not found." })
    }
    return res.status(200).json({ user })
  } catch (err) {
    console.error("Profile error:", err)
    return res.status(500).json({ message: "Internal server error." })
  }
}

module.exports = {
  sendOTPController,
  userRegisterController,
  userLoginController,
  userLogoutController,
  userProfileController
}