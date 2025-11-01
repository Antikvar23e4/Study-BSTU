const WebSocket = require("ws");

const PORT = 4000;
const wss = new WebSocket.Server({ port: PORT });

let messageCounter = 0;
const PING_INTERVAL = 5000;
const BROADCAST_INTERVAL = 15000;

console.log(`WebSocket server 11-03 started on port ${PORT}`);

function broadcast(data) {
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN && client.clientId) {
      client.send(data);
    }
  });
}

const broadcastInterval = setInterval(() => {
  messageCounter++;
  const message = `11-03-server: ${messageCounter}`;
  console.log(`Broadcasting: ${message}`);
  broadcast(message);
}, BROADCAST_INTERVAL);

const pingInterval = setInterval(() => {
  let aliveConnections = 0;
  wss.clients.forEach((ws) => {
    const clientId = ws.clientId || "Unknown";

    if (!ws.isAlive) {
      console.log(`Client ${clientId} unresponsive, terminating connection.`);
      return ws.terminate();
    }
    ws.isAlive = false;
    ws.ping(() => {});
    if (ws.clientId) {
      aliveConnections++;
    }
  });
  console.log(`Identified active connections: ${aliveConnections}`);
}, PING_INTERVAL);

wss.on("connection", (ws) => {
  ws.isAlive = true;
  ws.clientId = null;

  console.log("Client connected (ID pending identification)...");

  ws.on("pong", () => {
    ws.isAlive = true;
  });

  ws.on("message", (message) => {
    try {
      const data = JSON.parse(message);

      if (data.type === "identify" && data.id) {
        let idExists = false;
        wss.clients.forEach((client) => {
          if (client !== ws && client.clientId === data.id) {
            idExists = true;
          }
        });

        if (idExists) {
          console.warn(
            `Client tried to identify with existing ID: ${data.id}. Closing connection.`
          );
          ws.send(JSON.stringify({ error: `ID ${data.id} already in use.` }));
          ws.terminate();
          return;
        }

        ws.clientId = data.id;
        console.log(`Client identified as: ${ws.clientId}`);
        ws.send(
          JSON.stringify({
            type: "ack",
            id: ws.clientId,
            status: "Identified successfully",
          })
        );
        return;
      }

      const clientId = ws.clientId || "Unknown";
      console.log(`Received message from ${clientId}: ${message}`);
    } catch (e) {
      const clientId = ws.clientId || "Unknown";
      console.log(
        `Received non-JSON/invalid message from ${clientId}: ${message.toString()}`
      );
    }
  });

  ws.on("close", () => {
    const clientId = ws.clientId || "Unknown";
    console.log(`Client ${clientId} disconnected.`);
  });

  ws.on("error", (error) => {
    const clientId = ws.clientId || "Unknown";
    console.error(`WebSocket error for client ${clientId}:`, error);
  });
});

wss.on("close", () => {
  console.log("Server shutting down...");
  clearInterval(broadcastInterval);
  clearInterval(pingInterval);
});

wss.on("error", (error) => {
  console.error("WebSocket Server error:", error);
});
