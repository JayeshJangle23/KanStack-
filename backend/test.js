require("dotenv").config();

const nodemailer = require("nodemailer");
require("dotenv").config();

async function sendMail() {
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  await transporter.sendMail({
    from: process.env.SMTP_FROM,
    to: "yagneshjangle@gmail.com",
    subject: "Testing KanbanFlow",
    html: "<h1>Hello from Nodemailer</h1>",
  });

  console.log("Email Sent");
}

sendMail();