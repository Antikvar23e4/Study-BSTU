const WebSocket = require("ws");
const { v4: uuidv4 } = require("uuid");

const SERVER_URL = "ws://localhost:4000";

const clientId = `Client-${uuidv4().substring(0, 8)}`;

console.log(`Starting ${clientId}...`);

const ws = new WebSocket(SERVER_URL);

ws.on("open", () => {
  console.log(`${clientId}: Connected to server.`);
  ws.send(JSON.stringify({ type: "identify", id: clientId }));
});

ws.on("message", (message) => {
  console.log(`${clientId}: Received from server: ${message}`);
});

ws.on("close", (code, reason) => {
  const reasonText = reason ? reason.toString() : "No reason provided";
  console.log(
    `${clientId}: Disconnected from server. Code: ${code}, Reason: ${reasonText}`
  );
});

ws.on("error", (error) => {
  console.error(`${clientId}: WebSocket error:`, error);
});

console.log(`${clientId} running. Press Ctrl+C to exit.`);
