const WebSocket = require("ws");

const PORT = 8080;

// Создаем экземпляр WebSocket сервера
const wss = new WebSocket.Server({ port: PORT });

// Используем Set для хранения всех подключенных клиентов
const clients = new Set();

console.log(`[Broadcast Server] WebSocket server started on port ${PORT}`);

wss.on("connection", (ws, req) => {
  // Получаем IP-адрес подключившегося клиента.
  const clientIp = req.socket.remoteAddress;
  console.log(`[Broadcast Server] Client connected from ${clientIp}`);

  // Добавляем нового клиента
  clients.add(ws);
  console.log(`[Broadcast Server] Total clients: ${clients.size}`);

  ws.on("message", (message) => {
    const messageString = message.toString();
    console.log(
      `[Broadcast Server] Received from ${clientIp}: ${messageString}`
    );

    // Рассылка полученного сообщения всем  подключенным клиентам.
    clients.forEach((client) => {
      // client - текущий элемент итерации
      // ws - клиент, от которого пришло исходное сообщение
      if (client !== ws && client.readyState === WebSocket.OPEN) {
        try {
          client.send(messageString);
        } catch (error) {
          console.error(
            `[Broadcast Server] Error sending to a client: ${error.message}`
          );
        }
      }
    });
    console.log(
      `[Broadcast Server] Broadcast attempt finished for message from ${clientIp}.`
    );
  });

  ws.on("close", (code, reason) => {
    const reasonString = reason ? reason.toString() : "No reason";
    console.log(
      `[Broadcast Server] Client from ${clientIp} disconnected. Code: ${code}, Reason: ${reasonString}`
    );
    // Удаляем объект соединения этого клиента из Set.
    clients.delete(ws);
    console.log(`[Broadcast Server] Total clients: ${clients.size}`);
  });

  ws.on("error", (error) => {
    console.error(
      `[Broadcast Server] Error from client ${clientIp}: ${error.message}`
    );
    if (clients.has(ws)) {
      clients.delete(ws);
      console.log(
        `[Broadcast Server] Client ${clientIp} removed due to error. Total clients: ${clients.size}`
      );
    }
    try {
      if (ws.readyState !== WebSocket.CLOSED) {
        ws.close(1011, "WebSocket error");
      }
    } catch (closeError) {}
  });

  ws.send("[Server] Welcome to the broadcast chat!");
});

wss.on("error", (error) => {
  console.error(`[Broadcast Server] Server Error: ${error.message}`);
  if (error.code === "EADDRINUSE") {
    console.error(`[Broadcast Server] Port ${PORT} is already in use.`);
  }
});

console.log("[Broadcast Server] Waiting for connections...");
