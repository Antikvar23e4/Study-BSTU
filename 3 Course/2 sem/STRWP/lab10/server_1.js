const http = require("http");
const WebSocket = require("ws"); //
const fs = require("fs");
const path = require("path");

const HTTP_PORT = 3000;
const WS_PORT = 4000;
const HTML_FILE_PATH = path.join(__dirname, "page.html");

// HTTP
const httpServer = http.createServer((req, res) => {
  if (req.method === "GET" && req.url === "/start") {
    fs.readFile(HTML_FILE_PATH, (err, data) => {
      if (err) {
        console.error(`[HTTP] Error reading file ${HTML_FILE_PATH}:`, err);
        res.writeHead(500, { "Content-Type": "text/plain; charset=utf-8" });
        res.end("500 - Internal Server Error");
        return;
      }
      res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
      res.end(data);
      console.log(`[HTTP] Served ${HTML_FILE_PATH} for GET /start`);
    });
  } else {
    console.log(`[HTTP] Received invalid request: ${req.method} ${req.url}`);
    res.writeHead(400, { "Content-Type": "text/plain; charset=utf-8" });
    res.end("400 - Bad Request");
  }
});
httpServer.listen(HTTP_PORT, () => {
  console.log(
    `[HTTP] Server listening on port ${HTTP_PORT}. Visit http://localhost:${HTTP_PORT}/start`
  );
});

//WebSocket
const wss = new WebSocket.Server({ port: WS_PORT });
console.log(`[WS] Server listening on port ${WS_PORT}`);

// Хранилище для состояний клиентов
const clientStates = new Map();

wss.on("connection", (ws, req) => {
  const clientIp = req.socket.remoteAddress;
  const clientId = Symbol("clientId");
  console.log(
    `[WS] Client connected from ${clientIp}. Assigning ID: ${clientId.toString()}`
  );

  const initialState = {
    clientId: clientId,
    lastClientMsgNum: 0, // Последний номер сообщения, полученный ОТ клиента
    serverMsgCounter: 0, // Счетчик сообщений, отправленных  клиенту
    intervalId: null, // ID интервала для отправки сообщений  клиенту
  };
  // Сохраняем состояние этого клиента в Map, используя объект соединения 'ws' как ключ.
  clientStates.set(ws, initialState);
  console.log(
    `[WS] State initialized for ${clientId.toString()}. Total clients: ${
      clientStates.size
    }`
  );

  // приема сообщений от клиента
  ws.on("message", (message) => {
    const state = clientStates.get(ws);
    if (!state) return;
    const messageString = message.toString();
    console.log(
      `[WS] Received from ${state.clientId.toString()}: ${messageString}`
    );

    // номер сообщения клиента (n)
    const match = messageString.match(/10-01-client:\s*(\d+)/);
    if (match && match[1]) {
      state.lastClientMsgNum = parseInt(match[1], 10);
    } else {
      console.warn(
        `[WS] Could not parse client message number from ${state.clientId.toString()}: ${messageString}`
      );
    }

    //отправку сообщений сервера каждые 5 сек
    if (state.intervalId === null) {
      console.log(
        `[WS] Starting server message interval for ${state.clientId.toString()}.`
      );
      state.intervalId = setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) {
          state.serverMsgCounter++;
          const serverMessage = `10-01-server: ${state.lastClientMsgNum}->${state.serverMsgCounter}`;
          ws.send(serverMessage);
          console.log(
            `[WS] Sent to ${state.clientId.toString()}: ${serverMessage}`
          );
        } else {
          console.log(
            `[WS] Client ${state.clientId.toString()} is not OPEN. Stopping server interval.`
          );
          clearInterval(state.intervalId);
          state.intervalId = null; // Сбросить ID интервала в состоянии
          // Очистка state из clientStates произойдет в обработчике 'close'
        }
      }, 5000);
      // Сохраняем обновленное состояние (с новым intervalId) обратно в Map.
      clientStates.set(ws, state);
    }
  });

  // Обработчик закрытия соединения для данного клиента
  ws.on("close", (code, reason) => {
    const state = clientStates.get(ws);
    const clientIdStr = state ? state.clientId.toString() : "Unknown Client";
    const reasonString = reason ? reason.toString() : "No reason provided";
    console.log(
      `[WS] Client ${clientIdStr} disconnected. Code: ${code}, Reason: ${reasonString}`
    );

    if (state) {
      // Если состояние клиента было найдено в Map.
      if (state.intervalId !== null) {
        clearInterval(state.intervalId);
        console.log(
          `[WS] Server interval cleared for ${clientIdStr} on close.`
        );
      }
      // Удаляем состояние клиента из Map
      clientStates.delete(ws);
      console.log(
        `[WS] Client state removed for ${clientIdStr}. Total clients: ${clientStates.size}`
      );
    } else {
      console.warn("[WS] Client disconnected, but its state was not found.");
    }
  });

  ws.on("error", (error) => {
    const state = clientStates.get(ws);
    const clientIdStr = state ? state.clientId.toString() : "Unknown Client";
    console.error(`[WS] WebSocket error from ${clientIdStr}: ${error.message}`);
    if (state && state.intervalId !== null) {
      clearInterval(state.intervalId);
      console.log(`[WS] Server interval cleared for ${clientIdStr} on error.`);
    }
  });
});

httpServer.on("error", (error) => {
  console.error(`[HTTP] Server Error: ${error.message}`);
  if (error.code === "EADDRINUSE") {
    console.error(`[HTTP] Port ${HTTP_PORT} is already in use.`);
  }
});
