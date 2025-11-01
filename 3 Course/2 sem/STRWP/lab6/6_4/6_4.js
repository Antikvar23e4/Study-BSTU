const http = require("http");
const url = require("url");
const { send } = require("C:/Users/PC/AppData/Roaming/npm/node_modules/m06_3");

const dotenv = require("dotenv");

dotenv.config();

const MESSAGE = "hello";

const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url, true);

  if (parsedUrl.pathname === "/send" && req.method === "GET") {
    send(MESSAGE);
    res.writeHead(200, { "Content-Type": "text/plain" });
    res.end("Message sent successfully!");
  } else {
    res.writeHead(404, { "Content-Type": "text/plain" });
    res.end("Page not found");
  }
});

server.listen(3000, () => {
  console.log("Server is running at http://localhost:3000");
});
