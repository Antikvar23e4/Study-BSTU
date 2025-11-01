const http = require("http");
const fs = require("fs");
const url = require("url");
const { parse } = require("querystring");
const nodemailer = require("nodemailer");

const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url);

  if (parsedUrl.pathname === "/" && req.method === "GET") {
    fs.readFile("6_2.html", (err, data) => {
      if (err) {
        res.writeHead(500, { "Content-Type": "text/plain" });
        res.end("Ошибка сервера");
      } else {
        res.writeHead(200, { "Content-Type": "text/html" });
        res.end(data);
      }
    });
  } else if (parsedUrl.pathname === "/send" && req.method === "POST") {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk.toString();
    });

    req.on("end", () => {
      const params = parse(body);
      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: "nemkovich.anastasia@gmail.com",
          pass: "vwzv udpu woel gnht",
        },
      });

      const mailOptions = {
        from: params.sender,
        to: params.receiver,
        subject: "Сообщение с формы",
        text: params.message,
      };

      transporter.sendMail(mailOptions, (err, info) => {
        if (err) {
          res.writeHead(500, { "Content-Type": "text/plain" });
          res.end("Error sending the email");
          console.error(err);
        } else {
          res.writeHead(200, { "Content-Type": "text/html" });
          res.end(`
            <h2>Email sent successfully!</h2>
            <p><strong>Sender:</strong> ${params.sender}</p>
            <p><strong>Recipient:</strong> ${params.receiver}</p>
            <p><strong>Message:</strong> ${params.message}</p>
          `);
          console.log("Email sent:", info.response);
        }
      });
    });
  } else {
    res.writeHead(404, { "Content-Type": "text/plain" });
    res.end("Page not found");
  }
});

server.listen(3000, () => {
  console.log("Сервер запущен на http://localhost:3000");
});
