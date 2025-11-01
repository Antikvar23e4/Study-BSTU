const nodemailer = require("nodemailer");
const dotenv = require("dotenv");

dotenv.config();

console.log("Environment variables:");
console.log("EMAIL:", process.env.EMAIL);
console.log(
  "PASSWORD:",
  process.env.PASSWORD ? "Password exists" : "Password missing"
);
console.log("RECIEVER:", process.env.RECIEVER);

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  auth: {
    user: process.env.EMAIL,
    pass: process.env.PASSWORD,
  },
});

function send(message) {
  const recipient = process.env.RECIEVER || "nemkovich.anastasia@gmail.com";

  const mailOptions = {
    from: process.env.EMAIL || "nemkovich.anastasia@gmail.com",
    to: recipient,
    subject: "Message from m0603",
    text: message,
  };

  return new Promise((resolve, reject) => {
    transporter.sendMail(mailOptions, (err, info) => {
      if (err) {
        console.log("Error sending email:", err);
        reject(err);
      } else {
        console.log("Email sent successfully:", info.response);
        resolve(info);
      }
    });
  });
}

module.exports = { send };
