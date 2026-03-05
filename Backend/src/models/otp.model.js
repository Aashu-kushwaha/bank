const mongoose = require("mongoose")

const otpSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true
  },
  otp: {
    type: String,
    required: true
  },
  expiresAt: {
    type: Date,
    required: true,
    index: { expires: 0 } // MongoDB auto-deletes when expiresAt is reached
  }
})

const otpModel = mongoose.model("otp", otpSchema)
module.exports = otpModel