const WebSocket = require("ws");
const SERVER_URL = "ws://localhost:4000";
const ws = new WebSocket(SERVER_URL);

const EVENT_TO_SUBSCRIBE = "B";

ws.on("open", () => {
  console.log(
    `Client B: Connected. Subscribing to event ${EVENT_TO_SUBSCRIBE}...`
  );
  ws.send(JSON.stringify({ type: "subscribe", event: EVENT_TO_SUBSCRIBE }));
});

ws.on("message", (message) => {
  try {
    const data = JSON.parse(message);
    if (data.type === "event" && data.event === EVENT_TO_SUBSCRIBE) {
      console.log(
        `Client B: Received Event ${data.event} at ${new Date(
          data.timestamp
        ).toLocaleTimeString()}`
      );
    } else if (data.status) {
      console.log(`Client B: Server Status - ${data.status}`);
    } else {
      console.log(`Client B: Received other message:`, data);
    }
  } catch (e) {
    console.log(`Client B: Received raw message: ${message}`);
  }
});

ws.on("close", () => {
  console.log("Client B: Disconnected.");
});

ws.on("error", (error) => {
  console.error("Client B: WebSocket error:", error);
});
