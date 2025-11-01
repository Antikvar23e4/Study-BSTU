const http = require("http");
const path = require("path");
const handleRequest = require("./m07");

const staticDir = path.join(__dirname, "static");

const server = http.createServer((req, res) => {
  if (req.method === "GET") {
    if (req.url === "/") {
      req.url = "/index.html";
    }
    handleRequest(req, res, staticDir);
  } else {
    res.writeHead(405, { "Content-Type": "text/plain" });
    res.end("Method Not Allowed");
  }
});

server.listen(8080, () => {
  console.log("Server running at http://localhost:8080/");
});
