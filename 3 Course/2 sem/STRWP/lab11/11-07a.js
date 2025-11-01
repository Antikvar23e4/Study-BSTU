const WebSocket = require("ws");
const readline = require("readline");
const SERVER_URL = "ws://localhost:4000";
const ws = new WebSocket(SERVER_URL);

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

ws.on("open", () => {
  console.log("Connected to notification server.");
  promptForNotification();
});

function promptForNotification() {
  rl.question(
    'Enter notification (A, B, or C) or type "exit" to quit: ',
    (input) => {
      const notification = input.trim().toUpperCase();

      if (notification === "EXIT") {
        rl.close();
        ws.close();
        return;
      }
      if (
        notification === "A" ||
        notification === "B" ||
        notification === "C"
      ) {
        console.log(`Sending notification: ${notification}`);
        ws.send(notification);
      } else {
        console.log("Invalid input. Please enter A, B, or C.");
        promptForNotification();
      }
    }
  );
}

ws.on("message", (message) => {
  console.log(`Server response: ${message}`);
  promptForNotification();
});

ws.on("close", () => {
  console.log("Disconnected from notification server.");
  rl.close();
});

ws.on("error", (error) => {
  console.error("WebSocket error:", error);
  rl.close();
});
