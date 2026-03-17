const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
})

// Verify the connection configuration
transporter.verify((error, success) => {
  if (error) {
    console.error('Error connecting to email server:', error);
  } else {
    console.log('Email server is ready to send messages');
  }
});

// Function to send email
const sendEmail = async (to, subject, text, html) => {
  try {
    const info = await transporter.sendMail({
      from: `"morepay" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      text,
      html,
    });
    console.log('Message sent: %s', info.messageId);
  } catch (error) {
    console.error('Error sending email:', error);
  }
};

async function sendOTPEmail(email, otp) {
  await sendEmail(
    email,
    "Verify your morepay account",
    '',
    `
    <div style="font-family:sans-serif;max-width:500px;margin:0 auto">
      <h2>Verify your email</h2>
      <p>Your OTP for registration is:</p>
      <h1 style="letter-spacing:8px;color:#c9a84c;background:#1a1400;padding:16px;border-radius:8px;text-align:center">${otp}</h1>
      <p>This OTP expires in <strong>5 minutes</strong>.</p>
      <p>If you did not request this, ignore this email.</p>
      <p>Best regards,<br><strong>The morepay Team</strong></p>
    </div>
    `
  )
}

async function sendRegistrationEmail(userEmail, name, accountId) {
  await sendEmail(
    userEmail,
    'Welcome to morepay! Your Account Details',
    '',
    `
    <div style="font-family:sans-serif;max-width:500px;margin:0 auto">
      <h2>Hello ${name},</h2>
      <p>Welcome to <strong>morepay</strong>! Your account has been created successfully.</p>
      <h3>Your Account Details:</h3>
      <div style="background:#1a1400;padding:20px;border-radius:8px;border:1px solid #c9a84c">
        <p style="color:#a09890;margin:0 0 8px;font-size:12px">ACCOUNT NUMBER</p>
        <p style="color:#c9a84c;font-size:18px;letter-spacing:4px;margin:0;font-family:monospace">${accountId}</p>
      </div>
      <p style="color:#666;font-size:13px;margin-top:16px">
        ⚠️ Keep this safe — share it with others to receive money.
      </p>
      <br>
      <p>Best regards,<br><strong>The morepay Team</strong></p>
    </div>
    `
  )
}

async function sendLoginEmail(userEmail, name) {
  await sendEmail(
    userEmail,
    'New Login Alert',
    '',
    `
    <div style="font-family:sans-serif;max-width:500px;margin:0 auto">
      <h2>Hello ${name},</h2>
      <p>We noticed a new login to your account.</p>
      <p>If this was you, you can safely ignore this email.</p>
      <p>If you suspect any unauthorized access, please change your password immediately.</p>
      <p>Best regards,<br><strong>The morepay Team</strong></p>
    </div>
    `
  )
}

async function sendTransactionEmail(userEmail, name, amount, toAccount) {
  await sendEmail(
    userEmail,
    'Transaction Successful!',
    '',
    `
    <div style="font-family:sans-serif;max-width:500px;margin:0 auto">
      <h2>Hello ${name},</h2>
      <p>Your transaction was successful!</p>
      <div style="background:#1a1400;padding:20px;border-radius:8px;border:1px solid #c9a84c">
        <p style="color:#a09890;margin:0 0 8px;font-size:12px">AMOUNT SENT</p>
        <p style="color:#c9a84c;font-size:24px;font-weight:bold;margin:0">₹${amount}</p>
        <p style="color:#a09890;margin:8px 0 4px;font-size:12px">TO ACCOUNT</p>
        <p style="color:#c9a84c;font-size:14px;font-family:monospace;margin:0">${toAccount}</p>
      </div>
      <p>Best regards,<br><strong>The morepay Team</strong></p>
    </div>
    `
  )
}

async function sendTransactionFailureEmail(userEmail, name, amount, toAccount) {
  await sendEmail(
    userEmail,
    'Transaction Failed',
    '',
    `
    <div style="font-family:sans-serif;max-width:500px;margin:0 auto">
      <h2>Hello ${name},</h2>
      <p>We regret to inform you that your transaction of <strong>₹${amount}</strong> to account <strong>${toAccount}</strong> has failed.</p>
      <p>Please try again later.</p>
      <p>Best regards,<br><strong>The morepay Team</strong></p>
    </div>
    `
  )
}

async function moneyReceivedEmail(userEmail, name, amount, fromAccount) {
  await sendEmail(
    userEmail,
    'Money Received!',
    '',
    `
    <div style="font-family:sans-serif;max-width:500px;margin:0 auto">
      <h2>Hello ${name},</h2>
      <p>You have received money!</p>
      <div style="background:#0a1a0a;padding:20px;border-radius:8px;border:1px solid #4caf7a">
        <p style="color:#a09890;margin:0 0 8px;font-size:12px">AMOUNT RECEIVED</p>
        <p style="color:#4caf7a;font-size:24px;font-weight:bold;margin:0">₹${amount}</p>
        <p style="color:#a09890;margin:8px 0 4px;font-size:12px">FROM ACCOUNT</p>
        <p style="color:#4caf7a;font-size:14px;font-family:monospace;margin:0">${fromAccount}</p>
      </div>
      <p>Best regards,<br><strong>The morepay Team</strong></p>
    </div>
    `
  )
}
async function sendForgotPasswordEmail(email, name, otp) {
  await sendEmail(email, 'Reset your morepay password', '', `
    <div style="font-family:sans-serif;max-width:500px;margin:0 auto">
      <h2>Hello ${name},</h2>
      <p>You requested to reset your password.</p>
      <h1 style="letter-spacing:8px;color:#c9a84c;background:#1a1400;padding:16px;border-radius:8px;text-align:center">${otp}</h1>
      <p>This OTP expires in <strong>5 minutes</strong>.</p>
      <p>If you didn't request this, ignore this email.</p>
      <p>Best regards,<br><strong>The morepay Team</strong></p>
    </div>
  `)
}

async function sendPasswordChangedEmail(email, name) {
  await sendEmail(email, 'Password Changed Successfully', '', `
    <div style="font-family:sans-serif;max-width:500px;margin:0 auto">
      <h2>Hello ${name},</h2>
      <p>Your morepay password has been changed successfully.</p>
      <p>If you did not make this change, please contact support immediately.</p>
      <p>Best regards,<br><strong>The morepay Team</strong></p>
    </div>
  `)
}


module.exports = {
  sendOTPEmail,
  sendRegistrationEmail,
  sendLoginEmail,
  sendTransactionEmail,
  sendTransactionFailureEmail,
  moneyReceivedEmail,
  sendForgotPasswordEmail,
  sendPasswordChangedEmail
};