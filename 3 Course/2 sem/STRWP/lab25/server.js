const express = require("express");
const jayson = require("jayson");

const app = express();

const methods = {
  sum: function (args, callback) {
    if (!args || args.length === 0) {
      return callback({
        code: jayson.Server.errors.INVALID_PARAMS,
        message: "At least one number is required for sum.",
      });
    }
    try {
      const total = args.reduce((acc, val) => {
        const num = parseFloat(val);
        if (isNaN(num)) {
          throw new Error("All parameters must be numbers.");
        }
        return acc + num;
      }, 0);
      callback(null, total);
    } catch (e) {
      callback({
        code: jayson.Server.errors.INVALID_PARAMS,
        message: e.message,
      });
    }
  },

  mul: function (args, callback) {
    if (!args || args.length === 0) {
      return callback({
        code: jayson.Server.errors.INVALID_PARAMS,
        message: "At least one number is required for mul.",
      });
    }
    try {
      const product = args.reduce((acc, val) => {
        const num = parseFloat(val);
        if (isNaN(num)) {
          throw new Error("All parameters must be numbers.");
        }
        return acc * num;
      }, 1);
      callback(null, product);
    } catch (e) {
      callback({
        code: jayson.Server.errors.INVALID_PARAMS,
        message: e.message,
      });
    }
  },

  div: function (params, callback) {
    let x, y;
    if (Array.isArray(params) && params.length === 2) {
      [x, y] = params;
    } else if (
      typeof params === "object" &&
      params !== null &&
      params.hasOwnProperty("x") &&
      params.hasOwnProperty("y")
    ) {
      ({ x, y } = params);
    } else {
      return callback({
        code: jayson.Server.errors.INVALID_PARAMS,
        message:
          "Parameters x and y must be provided as an array [x,y] or an object {x: value, y: value}.",
      });
    }

    try {
      const numX = parseFloat(x);
      const numY = parseFloat(y);

      if (isNaN(numX) || isNaN(numY)) {
        throw new Error("Parameters x and y must be numbers.");
      }
      if (numY === 0) {
        return callback({ code: -32000, message: "Division by zero." });
      }
      callback(null, numX / numY);
    } catch (e) {
      callback({
        code: jayson.Server.errors.INVALID_PARAMS,
        message: e.message,
      });
    }
  },

  proc: function (params, callback) {
    let x, y;
    if (Array.isArray(params) && params.length === 2) {
      [x, y] = params;
    } else if (
      typeof params === "object" &&
      params !== null &&
      params.hasOwnProperty("x") &&
      params.hasOwnProperty("y")
    ) {
      ({ x, y } = params);
    } else {
      return callback({
        code: jayson.Server.errors.INVALID_PARAMS,
        message:
          "Parameters x and y must be provided as an array [x,y] or an object {x: value, y: value}.",
      });
    }

    try {
      const numX = parseFloat(x);
      const numY = parseFloat(y);

      if (isNaN(numX) || isNaN(numY)) {
        throw new Error("Parameters x and y must be numbers.");
      }
      if (numY === 0) {
        return callback({
          code: -32000,
          message: "Division by zero for percentage calculation.",
        });
      }
      callback(null, (numX / numY) * 100);
    } catch (e) {
      callback({
        code: jayson.Server.errors.INVALID_PARAMS,
        message: e.message,
      });
    }
  },
};

const server = new jayson.Server(methods);

app.use(express.json());

app.post("/jsonrpc", (req, res) => {
  const jsonRpcRequest = req.body;

  server.call(jsonRpcRequest, (jaysonCoreError, jsonRpcResponseObject) => {
    if (jaysonCoreError && !jsonRpcResponseObject) {
      console.error(
        "Jayson Core Error without a response object:",
        jaysonCoreError,
        "Request:",
        jsonRpcRequest
      );
      res.status(500).json({
        jsonrpc: "2.0",
        error: {
          code: -32000,
          message: "Invalid parameters. Server error processing the request",
        },
        id:
          jsonRpcRequest && jsonRpcRequest.hasOwnProperty("id")
            ? jsonRpcRequest.id
            : null,
      });
      return;
    }

    if (jsonRpcResponseObject) {
      res.status(200).json(jsonRpcResponseObject);
    } else {
      const isNotification =
        jsonRpcRequest && !jsonRpcRequest.hasOwnProperty("id");
      const isBatchOfNotifications =
        Array.isArray(jsonRpcRequest) &&
        jsonRpcRequest.length > 0 &&
        jsonRpcRequest.every((req) => req && !req.hasOwnProperty("id"));

      if (isNotification || isBatchOfNotifications) {
        res.status(204).send();
      } else {
        console.error(
          "Unexpected: Jayson returned no response object for a non-notification request. Request:",
          jsonRpcRequest
        );
        res.status(500).json({
          jsonrpc: "2.0",
          error: {
            code: -32603,
            message: "Internal server error: No response from RPC handler.",
          },
          id:
            jsonRpcRequest && jsonRpcRequest.hasOwnProperty("id")
              ? jsonRpcRequest.id
              : null,
        });
      }
    }
  });
});

const port = 3000;
app.listen(port, () => {
  console.log(
    `JSON-RPC сервер на Node.js запущен на http://localhost:${port}/jsonrpc`
  );
});
