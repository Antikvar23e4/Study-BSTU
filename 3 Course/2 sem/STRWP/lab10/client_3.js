const WebSocket = require("ws");
const readline = require("readline");
const crypto = require("crypto");

const SERVER_URL = "ws://localhost:8080";

// генерация айди
const SHORT_RANDOM_ID = crypto.randomBytes(3).toString("hex").toUpperCase();
const CLIENT_ID = `Client-${SHORT_RANDOM_ID}`;

console.log(`[${CLIENT_ID}] Attempting to connect to ${SERVER_URL}...`);
// Создаем экземпляр клиента WebSocket
const ws = new WebSocket(SERVER_URL);

// Создаем интерфейс readline для чтения ввода из стандартного потока
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  prompt: "> ",
});

ws.on("open", () => {
  console.log(`\n[${CLIENT_ID}] Connected to the broadcast server.`);
  console.log("Type messages and press Enter to send. Type 'exit' to quit.");
  rl.prompt();
  ws.send(`[${CLIENT_ID}] has joined the chat.`);
});

// чтобы при получениии соообщения не удалялось что я вводила ранее
ws.on("message", (data) => {
  const messageString = data.toString();
  readline.cursorTo(process.stdout, 0);
  readline.clearLine(process.stdout, 0);
  console.log(`${messageString}`);
  rl.prompt(true);
});

ws.on("close", (code, reason) => {
  const reasonString = reason ? reason.toString() : "No reason";
  console.log(
    `\n[${CLIENT_ID}] Disconnected from server. Code: ${code}, Reason: ${reasonString}`
  );
  rl.close();
  process.exit(0);
});

ws.on("error", (error) => {
  console.error(`\n[${CLIENT_ID}] WebSocket error: ${error.message}`);
  rl.close();
  process.exit(1);
});

// обработчик ввода в консоль
rl.on("line", (input) => {
  const trimmedInput = input.trim();
  if (trimmedInput.toLowerCase() === "exit") {
    console.log(`[${CLIENT_ID}] Closing connection...`);
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(`[${CLIENT_ID}] is leaving the chat.`);
    }
    ws.close(1000, `${CLIENT_ID} initiated exit`);
    rl.close();
  } else if (trimmedInput) {
    // Формируем сообщение для отправки
    const messageToSend = `[${CLIENT_ID}]: ${trimmedInput}`;
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(messageToSend);
    } else {
      console.log(
        `[${CLIENT_ID}] Cannot send message, connection is not open.`
      );
    }
    rl.prompt();
  } else {
    rl.prompt();
  }
});

rl.on("SIGINT", () => {
  console.log(`\n[${CLIENT_ID}] Received SIGINT (Ctrl+C). Exiting...`);
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(`[${CLIENT_ID}] is leaving the chat (SIGINT).`);
  }
  ws.close(1000, `${CLIENT_ID} received SIGINT`);
  rl.close();
});
