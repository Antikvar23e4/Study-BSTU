const WebSocket = require("ws");
const fs = require("fs");
const path = require("path");

const PORT = 4000;
const DOWNLOAD_DIR = path.join(__dirname, "download");

if (!fs.existsSync(DOWNLOAD_DIR)) {
  console.warn(
    `Warning: Download directory ${DOWNLOAD_DIR} not found. Creating.`
  );
  fs.mkdirSync(DOWNLOAD_DIR, { recursive: true });
}

const wss = new WebSocket.Server({ port: PORT });

console.log(`WebSocket server 11-02 started on port ${PORT}`);

wss.on("connection", (ws) => {
  console.log("Client connected");

  ws.on("message", (message) => {
    const requestedFile = message.toString();
    console.log(`Client requested file: ${requestedFile}`);

    const filepath = path.join(DOWNLOAD_DIR, requestedFile);

    if (!fs.existsSync(filepath)) {
      console.error(`File not found: ${filepath}`);
      ws.send(`Error: File "${requestedFile}" not found on server.`);
      return;
    }

    fs.readFile(filepath, (err, data) => {
      if (err) {
        console.error(`Error reading file ${filepath}:`, err);
        ws.send(`Error reading file: ${err.message}`);
      } else {
        ws.send(data, { binary: true }, (sendErr) => {
          if (sendErr) {
            console.error(`Error sending file ${requestedFile}:`, sendErr);
          } else {
            console.log(`File ${requestedFile} sent successfully.`);
          }
        });
      }
    });
  });

  ws.on("close", () => {
    console.log("Client disconnected");
  });

  ws.on("error", (error) => {
    console.error("WebSocket error:", error);
  });
});

wss.on("error", (error) => {
  console.error("WebSocket Server error:", error);
});
