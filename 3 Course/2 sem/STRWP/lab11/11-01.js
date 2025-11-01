const WebSocket = require("ws");
const fs = require("fs");
const path = require("path");
const { v4: uuidv4 } = require("uuid");

const PORT = 4000;
const UPLOAD_DIR = path.join(__dirname, "upload");

if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  console.log(`Created directory: ${UPLOAD_DIR}`);
}

const wss = new WebSocket.Server({ port: PORT });

console.log(`WebSocket server 11-01 started on port ${PORT}`);

wss.on("connection", (ws) => {
  console.log("Client connected");

  ws.on("message", (message) => {
    console.log("Received file chunk...");

    const filename = `${uuidv4()}.dat`;
    const filepath = path.join(UPLOAD_DIR, filename);

    try {
      fs.writeFile(filepath, message, (err) => {
        if (err) {
          console.error("Error saving file:", err);
          ws.send(`Error saving file: ${err.message}`);
        } else {
          console.log(`File saved successfully: ${filepath}`);
          ws.send(`File uploaded and saved as ${filename}`);
        }
      });
    } catch (error) {
      console.error("Error processing message:", error);
      ws.send(`Server error processing file: ${error.message}`);
    }
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
