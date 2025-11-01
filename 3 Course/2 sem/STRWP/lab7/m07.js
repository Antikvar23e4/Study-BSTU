const fs = require("fs");
const path = require("path");

const mimeTypes = {
  html: "text/html",
  css: "text/css",
  js: "text/javascript",
  png: "image/png",
  docx: "application/msword",
  json: "application/json",
  xml: "application/xml",
  mp4: "video/mp4",
};

function handleRequest(req, res, staticDir) {
  const filePath = path.join(staticDir, req.url);
  const extname = path.extname(filePath).slice(1);

  fs.exists(filePath, (exists) => {
    if (!exists) {
      res.writeHead(404, { "Content-Type": "text/plain" });
      res.end("File not found");
      return;
    }

    if (!mimeTypes[extname]) {
      res.writeHead(415, { "Content-Type": "text/plain" });
      res.end("Unsupported file type");
      return;
    }

    const mimeType = mimeTypes[extname];
    const fileStream = fs.createReadStream(filePath);

    res.writeHead(200, { "Content-Type": mimeType });
    fileStream.pipe(res);
  });
}

module.exports = handleRequest;
