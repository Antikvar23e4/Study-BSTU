const WebSocket = require("ws");

const PORT = 4000;
const wss = new WebSocket.Server({ port: PORT });

const subscriptions = {
  A: new Set(),
  B: new Set(),
  C: new Set(),
};

console.log(`WebSocket Pub/Sub server 11-06 started on port ${PORT}`);
console.log("Type A, B, or C and press Enter to publish events.");

wss.on("connection", (ws) => {
  console.log("Client connected");

  ws.on("message", (message) => {
    try {
      const data = JSON.parse(message);
      console.log("Received from client:", data);

      if (data.type === "subscribe" && subscriptions[data.event]) {
        console.log(`Client subscribed to event: ${data.event}`);
        subscriptions[data.event].add(ws);
        ws.send(JSON.stringify({ status: `Subscribed to ${data.event}` }));
      } else if (data.type === "unsubscribe" && subscriptions[data.event]) {
        console.log(`Client unsubscribed from event: ${data.event}`);
        subscriptions[data.event].delete(ws);
        ws.send(JSON.stringify({ status: `Unsubscribed from ${data.event}` }));
      } else {
        console.log("Unknown message type or event:", data);
        ws.send(JSON.stringify({ error: "Unknown request" }));
      }
    } catch (e) {
      console.error(
        "Failed to parse message or invalid format:",
        message.toString(),
        e
      );
    }
  });

  ws.on("close", () => {
    console.log("Client disconnected");
    for (const event in subscriptions) {
      subscriptions[event].delete(ws);
    }
  });

  ws.on("error", (error) => {
    console.error("WebSocket client error:", error);
    for (const event in subscriptions) {
      subscriptions[event].delete(ws);
    }
  });
});

function publishEvent(event) {
  if (!subscriptions[event]) {
    console.log(`No event type '${event}' defined.`);
    return;
  }
  const subscribers = subscriptions[event];
  if (subscribers.size === 0) {
    console.log(`No subscribers for event ${event}.`);
    return;
  }

  const message = JSON.stringify({
    type: "event",
    event: event,
    timestamp: Date.now(),
  });
  console.log(`Publishing event ${event} to ${subscribers.size} subscribers.`);

  subscribers.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    } else {
      console.log("Removing stale client from subscription.");
      subscribers.delete(client);
    }
  });
}

process.stdin.on("data", (data) => {
  const input = data.toString().trim().toUpperCase();
  if (input === "A" || input === "B" || input === "C") {
    publishEvent(input);
  } else if (input) {
    console.log(`Invalid input. Type A, B, or C to publish.`);
  }
});

wss.on("error", (error) => {
  console.error("WebSocket Server error:", error);
});
