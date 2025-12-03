require('dotenv').config();
const nodemailer = require('nodemailer');

const sendEmail = async ({ email, name, resetCode, subject }) => {
  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
    });

    const message = {
      from:`Gear-Zone App <${process.env.EMAIL_USER}>`,
      to:email,
      subject:subject,
      html: `
        <p>Hi ${name},</p>
        <p>We received a request to reset the password on your Gear-Zone account.</p>
        <p>Your password reset code is:</p>
        <h2 style="color: #0356CB; text-decoration: underline;">${resetCode}</h2>
        <p>Enter this code to complete the reset.</p>
        <p>Thanks for helping us keep your account secure.</p>
        <p>The Gear-Zone Team</p>
      `
    };

    const info = await transporter.sendMail(message);
    console.log('Email sent:', info.response);
    return info;
  } catch (err) {
    console.error('Error sending email:', err.message);
    throw err;
  }
};

module.exports = sendEmail;
