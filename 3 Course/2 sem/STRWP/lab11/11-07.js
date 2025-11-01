const WebSocket = require("ws");
const PORT = 4000;
const wss = new WebSocket.Server({ port: PORT });

console.log(`WebSocket Notification server 11-07 started on port ${PORT}`);

wss.on("connection", (ws) => {
  console.log("Client connected");

  ws.on("message", (message) => {
    const notification = message.toString().trim().toUpperCase();
    console.log(`Received message from client: ${notification}`);

    if (notification === "A" || notification === "B" || notification === "C") {
      console.log(`--> Received notification: ${notification}`);
      ws.send(`ACK: Received notification ${notification}`);
    } else {
      console.log(`--> Received unknown message: ${notification}`);
      ws.send(`ERR: Unknown notification type: ${notification}`);
    }
  });

  ws.on("close", () => {
    console.log("Client disconnected");
  });

  ws.on("error", (error) => {
    console.error("WebSocket client error:", error);
  });
});

wss.on("error", (error) => {
  console.error("WebSocket Server error:", error);
});
