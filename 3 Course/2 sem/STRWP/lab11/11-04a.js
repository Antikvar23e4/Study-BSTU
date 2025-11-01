const WebSocket = require("ws");
const SERVER_URL = "ws://localhost:4000";
const clientName = process.argv[2];

if (!clientName) {
  console.error(
    "Error: Please provide a client name as a command-line argument."
  );
  console.log("Usage: node 11-04a.js <client_name>");
  process.exit(1);
}

console.log(`Starting client with name: ${clientName}`);
const ws = new WebSocket(SERVER_URL);

ws.on("open", () => {
  console.log(`Client ${clientName}: Connected to server.`);
  const messageData = {
    client: clientName, // x - имя клиента из аргумента
    timestamp: Date.now(), // t - текущий штамп времени
  };

  console.log(`Client ${clientName}: Sending message:`, messageData);
  ws.send(JSON.stringify(messageData));
});

ws.on("message", (message) => {
  try {
    const receivedData = JSON.parse(message);
    console.log(
      `Client ${clientName}: Received response from server:`,
      receivedData
    );
    if (
      receivedData &&
      receivedData.server &&
      receivedData.client === clientName
    ) {
      console.log(
        `Client ${clientName}: Received valid response #${receivedData.server}`
      );
    } else {
      console.warn(
        `Client ${clientName}: Received unexpected response format:`,
        receivedData
      );
    }
  } catch (e) {
    console.error(
      `Client ${clientName}: Received non-JSON message or parse error:`,
      message.toString()
    );
  } finally {
  }
});

ws.on("close", () => {
  console.log(`Client ${clientName}: Disconnected from server.`);
});

ws.on("error", (error) => {
  console.error(`Client ${clientName}: WebSocket error:`, error);
});
