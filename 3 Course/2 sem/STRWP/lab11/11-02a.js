const WebSocket = require("ws");
const fs = require("fs");
const path = require("path");

const SERVER_URL = "ws://localhost:4000";
const FILE_TO_DOWNLOAD = "task2.txt";
const SAVE_DIR = path.join(__dirname, "task2_client");

if (!fs.existsSync(SAVE_DIR)) {
  fs.mkdirSync(SAVE_DIR, { recursive: true });
  console.log(`Created directory: ${SAVE_DIR}`);
}

const ws = new WebSocket(SERVER_URL);

ws.on("open", () => {
  console.log("Connected to server.");
  console.log(`Requesting file: ${FILE_TO_DOWNLOAD}`);
  ws.send(FILE_TO_DOWNLOAD);
});

ws.on("message", (message) => {
  if (Buffer.isBuffer(message)) {
    const savePath = path.join(SAVE_DIR, FILE_TO_DOWNLOAD);
    fs.writeFile(savePath, message, (err) => {
      if (err) {
        console.error("Error saving downloaded file:", err);
      } else {
        console.log(`File downloaded and saved successfully to ${savePath}`);
      }
      ws.close();
    });
  } else {
    console.log(`Server message: ${message}`);
    if (message.toString().startsWith("Error:")) {
      ws.close();
    }
  }
});

ws.on("close", () => {
  console.log("Disconnected from server.");
});

ws.on("error", (error) => {
  console.error("WebSocket error:", error);
});
