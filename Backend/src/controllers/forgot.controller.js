const userModel = require("../models/user.model.js")
const otpModel = require("../models/otp.model.js")
const emailservice = require("../services/email.service.js")
const crypto = require("crypto")

/**
 * Step 1 — Send OTP for password reset
 * POST /api/auth/forgot-password
 */
async function forgotPasswordController(req, res) {
  try {
    const { email } = req.body

    if (!email) {
      return res.status(400).json({ message: "Email is required." })
    }

    const user = await userModel.findOne({ email })
    if (!user) {
      // Don't reveal if email exists or not for security
      return res.status(200).json({
        message: "If this email is registered, an OTP has been sent."
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

    await emailservice.sendForgotPasswordEmail(email, user.name, otp)

    return res.status(200).json({
      message: "OTP sent to your email. Valid for 5 minutes.",
      email
    })

  } catch (err) {
    console.error("Forgot password error:", err)
    return res.status(500).json({ message: "Internal server error." })
  }
}

/**
 * Step 2 — Verify OTP and reset password
 * POST /api/auth/reset-password
 */
async function resetPasswordController(req, res) {
  try {
    const { email, otp, newPassword } = req.body

    if (!email || !otp || !newPassword) {
      return res.status(400).json({ message: "Email, OTP and new password are required." })
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ message: "Password must be at least 8 characters." })
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

    // Update password — let the model's pre-save hook hash it
    const user = await userModel.findOne({ email })
    if (!user) {
      return res.status(404).json({ message: "User not found." })
    }

    user.password = newPassword
    await user.save()

    await emailservice.sendPasswordChangedEmail(email, user.name)

    return res.status(200).json({
      message: "Password reset successfully. Please login with your new password."
    })

  } catch (err) {
    console.error("Reset password error:", err)
    return res.status(500).json({ message: "Internal server error." })
  }
}

module.exports = {
  forgotPasswordController,
  resetPasswordController
}