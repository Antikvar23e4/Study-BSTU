const WebSocket = require("ws");
const crypto = require("crypto"); // для генерации айдишников

const WS_URL = "ws://localhost:4000";
const SEND_INTERVAL_MS = 3000;
const AUTO_STOP_MS = 25000;

// генерация айди
const SHORT_RANDOM_ID = crypto.randomBytes(3).toString("hex").toUpperCase();
const INSTANCE_ID = `Client-${SHORT_RANDOM_ID}`;

let ws = null;
let clientInterval = null;
let stopTimeout = null;
let clientMessageCounter = 0;

function log(message, type = "info") {
  const level = type.toUpperCase();
  let colorPrefix = "";
  let colorSuffix = "\x1b[0m";
  switch (type) {
    case "client":
      colorPrefix = "\x1b[34m";
      break;
    case "server":
      colorPrefix = "\x1b[32m";
      break;
    case "error":
      colorPrefix = "\x1b[31m";
      break;
    case "info":
      colorPrefix = "\x1b[90m";
      break;
  }
  console.log(
    `${colorPrefix}[${INSTANCE_ID}] [${level}] ${message}${colorSuffix}`
  );
}

// -я для очистки ресурсов  чтобы остановить таймеры
function cleanup() {
  let cleaned = false;
  if (clientInterval) {
    clearInterval(clientInterval); //
    clientInterval = null;
    log("Client message interval cleared.", "info");
    cleaned = true;
  }
  if (stopTimeout) {
    clearTimeout(stopTimeout);
    stopTimeout = null;
    log("Auto-stop timeout cleared.", "info");
    cleaned = true;
  }
  if (cleaned) {
    log("Cleanup finished.", "info");
  }
}

log(
  `-> Starting WebSocket client. Attempting connection to ${WS_URL}...`,
  "info"
);

try {
  // Создаем новый экземпляр WebSocket клиента
  ws = new WebSocket(WS_URL);
  ws.on("open", () => {
    log(`Connection Established`, "info");
    // Запускаем интервал
    clientInterval = setInterval(() => {
      clientMessageCounter++;
      const messageToServer = `10-01-client: ${clientMessageCounter}`;
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(messageToServer);
        log(`Sent: ${messageToServer}`, "client");
      } else {
        log(
          `Cannot send, WS not open (state: ${ws.readyState}). Stopping interval.`,
          "error"
        );
        cleanup();
      }
    }, SEND_INTERVAL_MS);
    // таймаут для автоматической остановки клиента
    stopTimeout = setTimeout(() => {
      log(`Auto-stopping after ${AUTO_STOP_MS / 1000}s.`, "info");
      if (ws && ws.readyState === WebSocket.OPEN) {
        log(`Closing connection...`, "info");
        ws.close(
          1000,
          `${INSTANCE_ID}: Auto-stopped after ${AUTO_STOP_MS / 1000}s`
        );
      } else {
        cleanup();
      }
    }, AUTO_STOP_MS);
  });

  ws.on("message", (data) => {
    const messageString = data.toString();
    log(`Received: ${messageString}`, "server");
  });

  ws.on("close", (code, reason) => {
    const reasonString = reason ? reason.toString() : "No reason provided";
    const logType = code === 1000 ? "info" : "error";
    log(`Connection Closed. Code: ${code}, Reason: ${reasonString}`, logType);
    cleanup();
    log("Client instance finished.", "info");
  });

  ws.on("error", (error) => {
    log(`WebSocket Error: ${error.message}`, "error");
    cleanup();
    log("Client instance finished due to error.", "error");
  });
} catch (error) {
  log(`Failed to create WebSocket connection: ${error.message}`, "error");
  process.exit(1);
}

process.on("SIGINT", () => {
  log("Received SIGINT (Ctrl+C). Closing connection...", "info");
  cleanup();
  if (
    ws &&
    (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING)
  ) {
    ws.close(1000, `${INSTANCE_ID}: Received SIGINT`);
  }
  setTimeout(() => process.exit(0), 500);
});
