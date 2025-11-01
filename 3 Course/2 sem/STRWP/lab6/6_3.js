const http = require("http");
const url = require("url");
const { send } = require("./m06_3");
const dotenv = require("dotenv");

dotenv.config();

const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url, true);

  if (parsedUrl.pathname === "/send" && req.method === "GET") {
    const message = parsedUrl.query.message;

    if (message) {
      send(message);
      res.writeHead(200, { "Content-Type": "text/plain" });
      res.end(`Message sent successfully!\nYour message: ${message}`);
    } else {
      res.writeHead(400, { "Content-Type": "text/plain" });
      res.end("Message parameter is missing.");
    }
  } else {
    res.writeHead(404, { "Content-Type": "text/plain" });
    res.end("Page not found");
  }
});

server.listen(3000, () => {
  console.log("Server is running at http://localhost:3000");
});
//http://localhost:3000/send?message=Hello
