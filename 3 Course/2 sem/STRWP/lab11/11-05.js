const WebSocket = require("ws");

const PORT = 4000;
const wss = new WebSocket.Server({ port: PORT });

console.log(`WebSocket RPC server 11-05 started on port ${PORT}`);

const methods = {
  square: (params) => {
    if (!Array.isArray(params)) throw new Error("Params must be an array");
    if (params.length === 1) {
      const r = parseFloat(params[0]);
      if (isNaN(r)) throw new Error("Invalid parameter for circle area");
      return Math.PI * r * r;
    } else if (params.length === 2) {
      const a = parseFloat(params[0]);
      const b = parseFloat(params[1]);
      if (isNaN(a) || isNaN(b))
        throw new Error("Invalid parameters for rectangle area");
      return a * b;
    } else {
      throw new Error("Square method requires 1 or 2 parameters");
    }
  },
  sum: (params) => {
    if (!Array.isArray(params)) throw new Error("Params must be an array");
    return params.reduce((acc, val) => {
      const num = parseFloat(val);
      if (isNaN(num))
        throw new Error(`Invalid number in sum parameters: ${val}`);
      return acc + num;
    }, 0);
  },
  mul: (params) => {
    if (!Array.isArray(params)) throw new Error("Params must be an array");
    if (params.length === 0) return 0;
    return params.reduce((acc, val) => {
      const num = parseFloat(val);
      if (isNaN(num))
        throw new Error(`Invalid number in mul parameters: ${val}`);
      return acc * num;
    }, 1);
  },

  fib: (params) => {
    if (!Array.isArray(params) || params.length !== 1) {
      throw new Error("Fib method requires exactly 1 parameter");
    }
    const n = parseInt(params[0]);
    if (isNaN(n) || n < 0)
      throw new Error(
        "Invalid parameter for fib: must be a non-negative integer"
      );

    if (n === 0) return [0];
    if (n === 1) return [0, 1];

    const sequence = [0, 1];
    for (let i = 2; i <= n; i++) {
      sequence.push(sequence[i - 1] + sequence[i - 2]);
    }
    return sequence;
  },
  fact: (params) => {
    if (!Array.isArray(params) || params.length !== 1) {
      throw new Error("Fact method requires exactly 1 parameter");
    }
    const n = parseInt(params[0]);
    if (isNaN(n) || n < 0)
      throw new Error(
        "Invalid parameter for fact: must be a non-negative integer"
      );

    if (n === 0 || n === 1) return 1;
    let result = 1;
    for (let i = 2; i <= n; i++) {
      result *= i;
    }
    return result;
  },
};

wss.on("connection", (ws) => {
  console.log("Client connected for RPC");

  ws.on("message", (message) => {
    let request;
    try {
      request = JSON.parse(message);
      console.log("RPC Request:", request);

      if (
        !request.method ||
        !methods[request.method] ||
        !request.params === undefined
      ) {
        throw new Error(
          'Invalid RPC request format. Expected {method: "...", params: [...], id?: ...}'
        );
      }

      const method = methods[request.method];
      if (!method) {
        throw new Error(`Method '${request.method}' not found.`);
      }

      const result = method(request.params);
      const response = { result: result, id: request.id || null };
      console.log("RPC Response:", response);
      ws.send(JSON.stringify(response));
    } catch (error) {
      console.error("RPC Error:", error.message);
      const errorResponse = {
        error: error.message,
        id: request ? request.id : null,
      };
      ws.send(JSON.stringify(errorResponse));
    }
  });

  ws.on("close", () => {
    console.log("RPC Client disconnected");
  });

  ws.on("error", (error) => {
    console.error("WebSocket client error:", error);
  });
});

wss.on("error", (error) => {
  console.error("WebSocket Server error:", error);
});
