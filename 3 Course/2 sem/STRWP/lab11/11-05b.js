const WebSocket = require("ws");
const SERVER_URL = "ws://localhost:4000";
const ws = new WebSocket(SERVER_URL);

let callId = 0;
const pendingPromises = new Map();

function handleIncomingMessage(message) {
  try {
    const response = JSON.parse(message);
    if (response.id !== undefined && pendingPromises.has(response.id)) {
      const promiseHandlers = pendingPromises.get(response.id);
      console.log(`Received RPC Response #${response.id}:`, response);

      if (response.error) {
        promiseHandlers.reject(new Error(response.error));
      } else {
        promiseHandlers.resolve(response.result);
      }
      pendingPromises.delete(response.id);
    } else {
      console.warn(`Received message with unknown or missing ID:`, response);
    }
  } catch (e) {
    console.error(
      "Received non-JSON message or parse error:",
      message.toString(),
      e
    );
  }
}

function handleConnectionError(error) {
  console.error("WebSocket Connection Error:", error);
  pendingPromises.forEach((promiseHandlers, id) => {
    promiseHandlers.reject(
      new Error(`WebSocket connection error: ${error.message || error}`)
    );
  });
  pendingPromises.clear();
}

function handleConnectionClose() {
  console.log("WebSocket Connection Closed.");
  pendingPromises.forEach((promiseHandlers, id) => {
    promiseHandlers.reject(
      new Error("WebSocket connection closed before response received.")
    );
  });
  pendingPromises.clear();
  ws.removeListener("message", handleIncomingMessage);
  ws.removeListener("error", handleConnectionError);
  ws.removeListener("close", handleConnectionClose);
}

function rpcCall(method, params) {
  return new Promise((resolve, reject) => {
    if (ws.readyState !== WebSocket.OPEN) {
      reject(new Error("WebSocket connection is not open."));
      return;
    }
    const id = ++callId;
    const request = JSON.stringify({ method, params, id });

    pendingPromises.set(id, { resolve, reject });

    console.log(`Sending RPC Request #${id}: ${request}`);
    ws.send(request, (err) => {
      if (err) {
        pendingPromises.delete(id);
        reject(err);
      }
    });
  });
}

ws.on("open", async () => {
  console.log("Connected to RPC server for parallel calls.");

  ws.on("message", handleIncomingMessage);
  ws.once("error", handleConnectionError);
  ws.once("close", handleConnectionClose);

  const calls = [
    { method: "square", params: [3] }, // square(3)
    { method: "square", params: [5, 4] }, // square(5,4)
    { method: "sum", params: [2] }, // sum(2)
    { method: "sum", params: [2, 4, 6, 8, 10] }, // sum(2,4,6,8,10)
    { method: "mul", params: [3] }, // mul(3)
    { method: "mul", params: [3, 5, 7, 9, 11, 13] }, // mul(3,5,7,9,11,13)
    { method: "fib", params: [1] }, // fib(1)
    { method: "fib", params: [2] }, // fib(2)
    { method: "fib", params: [7] }, // fib(7)
    { method: "fact", params: [0] }, // fact(0)
    { method: "fact", params: [5] }, // fact(5)
    { method: "fact", params: [10] }, // fact(10)
  ];

  const promises = calls.map((call) =>
    rpcCall(call.method, call.params)
      .then((result) => ({
        call: `${call.method}(${call.params.join(",")})`,
        result,
      }))
      .catch((error) => ({
        call: `${call.method}(${call.params.join(",")})`,
        error: error.message,
      }))
  );
  if (ws.readyState === WebSocket.OPEN) {
    ws.close();
  }
});

ws.on("error", (error) => {
  if (ws.listenerCount("error") <= 1) {
    console.error("Initial WebSocket connection error:", error);
    pendingPromises.forEach((promiseHandlers) => {
      promiseHandlers.reject(
        new Error(
          `Initial WebSocket connection error: ${error.message || error}`
        )
      );
    });
    pendingPromises.clear();
  }
});
