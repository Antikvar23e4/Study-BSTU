const WebSocket = require("ws");
const SERVER_URL = "ws://localhost:4000";
const ws = new WebSocket(SERVER_URL);

let callId = 0;
const pendingCalls = {};

function rpcCall(method, params, callback) {
  const id = ++callId;
  const request = JSON.stringify({ method, params, id });
  pendingCalls[id] = callback;
  console.log(`Sending RPC Request #${id}: ${request}`);
  ws.send(request);
}

ws.on("open", () => {
  console.log("Connected to RPC server.");

  rpcCall("square", [3], (err, result) => {
    // square(3) - circle
    if (err) console.error("square(3) Error:", err);
    else console.log("square(3) Result:", result);

    rpcCall("square", [5, 4], (err, result) => {
      // square(5, 4) - rectangle
      if (err) console.error("square(5,4) Error:", err);
      else console.log("square(5,4) Result:", result);

      rpcCall("sum", [2], (err, result) => {
        // sum(2)
        if (err) console.error("sum(2) Error:", err);
        else console.log("sum(2) Result:", result);

        rpcCall("sum", [2, 4, 6, 8, 10], (err, result) => {
          // sum(2,4,6,8,10)
          if (err) console.error("sum(2,4,6,8,10) Error:", err);
          else console.log("sum(2,4,6,8,10) Result:", result);

          rpcCall("mul", [3], (err, result) => {
            // mul(3)
            if (err) console.error("mul(3) Error:", err);
            else console.log("mul(3) Result:", result);

            rpcCall("mul", [3, 5, 7, 9, 11, 13], (err, result) => {
              // mul(3,5,7,9,11,13)
              if (err) console.error("mul(3,5,7,9,11,13) Error:", err);
              else console.log("mul(3,5,7,9,11,13) Result:", result);

              rpcCall("fib", [1], (err, result) => {
                // fib(1)
                if (err) console.error("fib(1) Error:", err);
                else console.log("fib(1) Result:", result);

                rpcCall("fib", [2], (err, result) => {
                  // fib(2)
                  if (err) console.error("fib(2) Error:", err);
                  else console.log("fib(2) Result:", result);

                  rpcCall("fib", [7], (err, result) => {
                    // fib(7)
                    if (err) console.error("fib(7) Error:", err);
                    else console.log("fib(7) Result:", result);

                    rpcCall("fact", [0], (err, result) => {
                      // fact(0)
                      if (err) console.error("fact(0) Error:", err);
                      else console.log("fact(0) Result:", result);

                      rpcCall("fact", [5], (err, result) => {
                        // fact(5)
                        if (err) console.error("fact(5) Error:", err);
                        else console.log("fact(5) Result:", result);

                        rpcCall("fact", [10], (err, result) => {
                          // fact(10)
                          if (err) console.error("fact(10) Error:", err);
                          else console.log("fact(10) Result:", result);
                          console.log("\nAll sequential calls completed.");
                          ws.close();
                        });
                      });
                    });
                  });
                });
              });
            });
          });
        });
      });
    });
  });
});

ws.on("message", (message) => {
  try {
    const response = JSON.parse(message);
    console.log(`Received RPC Response #${response.id}:`, response);
    const callback = pendingCalls[response.id];
    if (callback) {
      if (response.error) {
        callback(response.error, null);
      } else {
        callback(null, response.result);
      }
      delete pendingCalls[response.id];
    } else {
      console.warn(
        `Received response for unknown or already processed call ID: ${response.id}`
      );
    }
  } catch (e) {
    console.error(
      "Received non-JSON message or parse error:",
      message.toString(),
      e
    );
  }
});

ws.on("close", () => {
  console.log("Disconnected from RPC server.");
});

ws.on("error", (error) => {
  console.error("WebSocket RPC error:", error);
  Object.keys(pendingCalls).forEach((id) => {
    pendingCalls[id]("Connection error", null);
    delete pendingCalls[id];
  });
});
