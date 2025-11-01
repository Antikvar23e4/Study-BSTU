const WebSocket = require("ws");
const PORT = 4000;
const wss = new WebSocket.Server({ port: PORT });

let serverMessageCounter = 0;

console.log(`WebSocket server 11-04 started on port ${PORT}`);

wss.on("connection", (ws) => {
  console.log("Client connected");

  ws.on("message", (message) => {
    let receivedData;
    try {
      receivedData = JSON.parse(message);
      console.log("Received from client:", receivedData);
      if (
        receivedData &&
        typeof receivedData === "object" &&
        receivedData.client &&
        receivedData.timestamp
      ) {
        serverMessageCounter++;
        const response = {
          server: serverMessageCounter, // n - номер сообщения
          client: receivedData.client, // x - имя клиента (из запроса)
          timestamp: receivedData.timestamp, // t - штамп времени (из запроса)
        };
        console.log("Sending response to client:", response);
        ws.send(JSON.stringify(response));
      } else {
        console.warn("Received invalid message format:", receivedData);
        ws.send(
          JSON.stringify({
            error:
              'Invalid message format. Expected {client: "name", timestamp: 123...}',
          })
        );
      }
    } catch (e) {
      console.error("Failed to parse JSON or process message:", e);
      console.error("Received raw data:", message.toString());
      ws.send(JSON.stringify({ error: "Invalid JSON received." }));
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
