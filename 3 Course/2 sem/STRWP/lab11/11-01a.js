const WebSocket = require("ws");
const fs = require("fs");
const path = require("path");

const SERVER_URL = "ws://localhost:4000";
const FILE_TO_UPLOAD = path.join(__dirname, "task1.txt");

const ws = new WebSocket(SERVER_URL);

ws.on("open", () => {
  console.log("Connected to server.");

  if (!fs.existsSync(FILE_TO_UPLOAD)) {
    console.error(`Error: File not found at ${FILE_TO_UPLOAD}`);
    ws.close();
    return;
  }

  fs.readFile(FILE_TO_UPLOAD, (err, data) => {
    if (err) {
      console.error("Error reading file:", err);
      ws.close();
      return;
    }
    ws.send(data, { binary: true }, (err) => {
      if (err) {
        console.error("Error sending file:", err);
      } else {
        console.log(`File ${path.basename(FILE_TO_UPLOAD)} sent successfully.`);
      }
    });
  });
});

ws.on("message", (message) => {
  console.log(`Server response: ${message}`);
  ws.close();
});

ws.on("close", () => {
  console.log("Disconnected from server.");
});

ws.on("error", (error) => {
  console.error("WebSocket error:", error);
});
